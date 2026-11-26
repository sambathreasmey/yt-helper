"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { LiveTicker, type TickerPoint } from "@/components/live-ticker";
import { pricePerUnit, unitLabelKey, units } from "@/features/gold-trading/gold-format";
import type { GoldUnit } from "@/services/gold-trading-api";
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
  /** Currency formatter; values passed here are already converted to the selected unit. */
  formatPrice: (value: number) => string;
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
  formatDelta,
}: GoldLivePriceProps) {
  const { t } = useLanguage();
  const [unit, setUnit] = useState<GoldUnit>("damlung");
  const convertPrice = useCallback(
    (value: number) => Number(pricePerUnit(String(value), unit)),
    [unit],
  );
  const formatSelectedPrice = useCallback(
    (value: number) => formatPrice(convertPrice(value)),
    [convertPrice, formatPrice],
  );
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

      <div aria-label={t("performanceUnit")} className="gold-unit-switch" role="group">
        {units.map((option) => (
          <button
            aria-pressed={unit === option}
            key={option}
            onClick={() => setUnit(option)}
            type="button"
          >
            {t(unitLabelKey(option))}
          </button>
        ))}
      </div>

      <LiveTicker
        animate={animate}
        baseline={yesterdayPrice}
        chartClassName="gold-live-chart"
        chartLabel={t("priceChart")}
        chartWindowMs={120_000}
        formatPrice={formatSelectedPrice}
        price={price}
        priceClassName="gold-live-ticker-price"
        series={history}
        showLastLabel
        waitingText={t("liveBadge")}
      >
        <div className="gold-live-price-meta">
          <span className="gold-live-unit-label">/ {t(unitLabelKey(unit))}</span>
          {trend !== "flat" && (
            <span className="gold-trend-chip" data-trend={trend} key={animate ? `${trend}-${price}` : undefined}>
              {trend === "up" ? <ArrowUpRight aria-hidden="true" size={13} /> : <ArrowDownRight aria-hidden="true" size={13} />}
              {formatDelta(convertPrice(Math.abs(delta)))}
            </span>
          )}
        </div>

        {dayChange && yesterdayPrice !== null && (
          <div className="gold-yesterday" data-trend={dayChange.trend}>
            <span className="gold-yesterday-label">{t("yesterdayPrice")}</span>
            <span className="gold-yesterday-value">{formatSelectedPrice(yesterdayPrice)}</span>
            {dayChange.trend !== "flat" && (
              <span className="gold-yesterday-change">
                {dayChange.trend === "up" ? <ArrowUpRight aria-hidden="true" size={12} /> : <ArrowDownRight aria-hidden="true" size={12} />}
                {formatDelta(convertPrice(Math.abs(dayChange.diff)))} ({dayChange.percent})
              </span>
            )}
          </div>
        )}
      </LiveTicker>

      {!liveStream && intervalSeconds > 0 && (
        <div aria-hidden="true" className="gold-refresh-track">
          <span
            className="gold-refresh-bar"
            key={priceUpdatedAt}
            style={{ animationDuration: `${intervalSeconds}s` }}
          />
        </div>
      )}
    </div>
  );
});
