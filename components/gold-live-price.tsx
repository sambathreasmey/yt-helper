"use client";

import { memo, useEffect, useId, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { GoldIcon } from "@/components/icons/gold-icon";
import { useLanguage } from "@/providers/language-provider";

const HISTORY_LIMIT = 30;

/** Keeps the prices seen during this session so the sparkline grows as polls arrive. */
export function usePriceHistory(price: number | null, updatedAt: number): number[] {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    if (price === null || !Number.isFinite(price)) return;
    setHistory((current) => [...current, price].slice(-HISTORY_LIMIT));
    // One point per successful poll, even when the price did not move.
  }, [price, updatedAt]);

  return history;
}

const Sparkline = memo(function Sparkline({ points, label }: { points: number[]; label: string }) {
  const gradientId = useId();
  const path = useMemo(() => {
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 100;
    const height = 32;
    const coords = points.map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - 3 - ((point - min) / range) * (height - 6);
      return [x, y] as const;
    });
    const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
    return { line, area: `${line} L${width} ${height} L0 ${height} Z`, last: coords[coords.length - 1] };
  }, [points]);

  if (!path) return <div aria-hidden="true" className="h-8" />;

  return (
    <svg aria-label={label} className="gold-sparkline" preserveAspectRatio="none" role="img" viewBox="0 0 100 32">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path.area} fill={`url(#${gradientId})`} />
      <path d={path.line} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
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
  history: number[];
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
      if (history[index] !== price) return history[index];
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
          <span aria-hidden="true" className="gold-live-dot" data-active={intervalSeconds > 0 || liveStream ? "true" : undefined} />
          {t("liveBadge")}
          <span className="gold-live-status"><RefreshStatus fetching={fetching} intervalSeconds={intervalSeconds} liveStream={liveStream} updatedAt={priceUpdatedAt} /></span>
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-end gap-x-3 gap-y-1">
        {price !== null && (
          <AnimatedNumber animate={animate} className="gold-price-amount" format={formatPrice} value={price} />
        )}
        {trend !== "flat" && (
          <span className="gold-trend-chip" data-trend={trend} key={`${trend}-${price}`}>
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
      <Sparkline label={t("priceChart")} points={history} />
    </div>
  );
});
