"use client";

import { memo, useEffect, useId, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { GoldIcon } from "@/components/icons/gold-icon";
import type { TickerPoint } from "@/components/live-ticker";
import { useLanguage } from "@/providers/language-provider";

const HISTORY_LIMIT = 120;

/** Keeps one live price point per second for a compact, low-overhead chart. */
export function usePriceHistory(price: number | null, updatedAt: number): TickerPoint[] {
  const [history, setHistory] = useState<TickerPoint[]>([]);

  useEffect(() => {
    if (price === null || !Number.isFinite(price)) return;
    const timestamp = Date.now();
    setHistory((current) => {
      const last = current[current.length - 1];
      if (last && timestamp - last.t < 1000) {
        return [...current.slice(0, -1), { t: last.t, p: price }];
      }
      return [...current, { t: timestamp, p: price }].slice(-HISTORY_LIMIT);
    });
  }, [price, updatedAt]);

  return history;
}

const LivePriceChart = memo(function LivePriceChart({ points, label }: { points: TickerPoint[]; label: string }) {
  const gradientId = useId();
  const path = useMemo(() => {
    if (points.length < 2) return null;
    const latest = points[points.length - 1].t;
    const visible = points.filter((point) => point.t >= latest - 120_000);
    if (visible.length < 2) return null;
    const prices = visible.map((point) => point.p);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 100;
    const height = 100;
    const timeRange = latest - visible[0].t || 1;
    const coords = visible.map((point) => {
      const x = ((point.t - visible[0].t) / timeRange) * width;
      const y = height - 8 - ((point.p - min) / range) * (height - 16);
      return { x, y };
    });
    let line = `M${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
    for (let index = 1; index < coords.length - 1; index += 1) {
      const midpointX = (coords[index].x + coords[index + 1].x) / 2;
      const midpointY = (coords[index].y + coords[index + 1].y) / 2;
      line += ` Q${coords[index].x.toFixed(2)} ${coords[index].y.toFixed(2)} ${midpointX.toFixed(2)} ${midpointY.toFixed(2)}`;
    }
    const last = coords[coords.length - 1];
    line += ` L${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
    return { line, area: `${line} L${last.x.toFixed(2)} ${height} L${coords[0].x.toFixed(2)} ${height} Z`, last };
  }, [points]);

  if (!path) return <div aria-hidden="true" className="gold-live-chart" />;

  return (
    <div aria-label={label} className="gold-live-chart live-mode-chart" role="img">
      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((y) => (
          <line className="live-mode-grid" key={y} x1="0" x2="100" y1={y} y2={y} />
        ))}
        <path d={path.area} fill={`url(#${gradientId})`} />
        <path className="live-mode-line" d={path.line} />
        <circle className="gold-live-chart-dot" cx={path.last.x} cy={path.last.y} r="2.7" />
      </svg>
    </div>
  );
});

/** Ticks once a second on its own, so the rest of the page does not re-render. */
function RefreshStatus({
  updatedAt,
  intervalSeconds,
  fetching,
  liveStream,
}: {
  updatedAt: number;
  intervalSeconds: number;
  fetching: boolean;
  liveStream: boolean;
}) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (liveStream || intervalSeconds === 0) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [intervalSeconds, liveStream, updatedAt]);

  if (liveStream) return <span>{t("landingMarketSource")}</span>;
  if (intervalSeconds === 0) return <span>{t("liveAutoOff")}</span>;
  if (fetching) return <span>{t("liveUpdating")}</span>;
  const remaining = Math.max(0, intervalSeconds - Math.floor((now - updatedAt) / 1000));
  return <span>{t("liveNextUpdate", { seconds: remaining })}</span>;
}

interface GoldLivePriceProps {
  price: number | null;
  priceUpdatedAt: number;
  intervalSeconds: number;
  fetching: boolean;
  animate: boolean;
  history: TickerPoint[];
  /** Yesterday's price per damlung. Leave out (or null) to hide the comparison. */
  yesterdayPrice?: number | null;
  /** True when price updates are arriving from the live WebSocket instead of polling. */
  liveStream?: boolean;
  formatPrice: (value: number) => string;
  /** Formats the price of one chi (1/10 damlung), given the price per damlung. Leave out to hide the chi pill. */
  formatChiPrice?: (pricePerDamlung: number) => string;
  formatDelta: (value: number) => string;
}

export const GoldLivePrice = memo(function GoldLivePrice({
  price,
  priceUpdatedAt,
  intervalSeconds,
  fetching,
  animate,
  history,
  yesterdayPrice = null,
  liveStream = false,
  formatPrice,
  formatChiPrice,
  formatDelta,
}: GoldLivePriceProps) {
  const { t } = useLanguage();
  // Direction since the price last moved, not just since the previous poll.
  const previous = useMemo(() => {
    for (let index = history.length - 2; index >= 0; index -= 1) {
      if (history[index].p !== price) return history[index].p;
    }
    return null;
  }, [history, price]);
  const delta = price !== null && previous !== null ? price - previous : 0;
  const trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  // Change versus yesterday. Hidden when the backend does not send a usable yesterday price.
  const dayChange = useMemo(() => {
    if (price === null || yesterdayPrice === null || !Number.isFinite(yesterdayPrice) || yesterdayPrice <= 0) {
      return null;
    }
    const diff = Math.round((price - yesterdayPrice) * 100) / 100;
    const dayTrend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    const sign = diff > 0 ? "+" : diff < 0 ? "\u2212" : "";
    const percent = `${sign}${Math.abs((diff / yesterdayPrice) * 100).toFixed(2)}%`;
    return { diff, trend: dayTrend, percent };
  }, [price, yesterdayPrice]);

  return (
    <div className="gold-live" data-trend={trend}>
      <div className="flex items-center justify-between gap-2">
        <span className="gold-live-badge">
          <span
            aria-hidden="true"
            className="gold-live-dot"
            data-active={intervalSeconds > 0 || liveStream ? "true" : undefined}
            data-pulse={animate ? "true" : undefined}
          />
          {t("liveBadge")}
          <span className="gold-live-status"><RefreshStatus fetching={fetching} intervalSeconds={intervalSeconds} liveStream={liveStream} updatedAt={priceUpdatedAt} /></span>
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-end gap-x-3 gap-y-1">
        {price !== null && (
          <AnimatedNumber animate={animate} className="gold-price-amount" format={formatPrice} value={price} />
        )}
        {trend !== "flat" && (
          <span className="gold-trend-chip" data-trend={trend} key={animate ? `${trend}-${price}` : undefined}>
            {trend === "up" ? <ArrowUpRight aria-hidden="true" size={13} /> : <ArrowDownRight aria-hidden="true" size={13} />}
            {formatDelta(Math.abs(delta))}
          </span>
        )}
      </div>

      {formatChiPrice && price !== null && (
        <div className="gold-unit-row">
          <span className="gold-unit-chip">
            <span aria-hidden="true" className="gold-unit-chip-icon">
              <GoldIcon size={12} strokeWidth={2.6} />
            </span>
            {formatChiPrice(price)}
          </span>
        </div>
      )}

      {dayChange && yesterdayPrice !== null && (
        <div className="gold-yesterday" data-trend={dayChange.trend}>
          <span className="gold-yesterday-label">{t("yesterdayPrice")}</span>
          <span className="gold-yesterday-value">{formatPrice(yesterdayPrice)}</span>
          {dayChange.trend !== "flat" && (
            <span className="gold-yesterday-change">
              {dayChange.trend === "up" ? <ArrowUpRight aria-hidden="true" size={12} /> : <ArrowDownRight aria-hidden="true" size={12} />}
              {formatDelta(Math.abs(dayChange.diff))} ({dayChange.percent})
            </span>
          )}
        </div>
      )}

      {!liveStream && intervalSeconds > 0 && (
        <div aria-hidden="true" className="gold-refresh-track">
          <span
            className="gold-refresh-bar"
            key={priceUpdatedAt}
            style={{ animationDuration: `${intervalSeconds}s` }}
          />
        </div>
      )}
      <LivePriceChart label={t("priceChart")} points={history} />
    </div>
  );
});
