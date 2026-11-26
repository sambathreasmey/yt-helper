"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Clock3, Minus } from "lucide-react";
import { LiveTicker, type TickerPoint } from "@/components/live-ticker";
import { pricePerUnit, unitLabelKey, units } from "@/features/gold-trading/gold-format";
import type { GoldUnit } from "@/services/gold-trading-api";
import { useLanguage } from "@/providers/language-provider";

const HISTORY_LIMIT = 120;
const LIVE_RANGES = [
  { label: "30s", windowMs: 30_000, requiresHistory: false },
  { label: "1m", windowMs: 60_000, requiresHistory: false },
  { label: "2m", windowMs: 120_000, requiresHistory: false },
  { label: "5m", windowMs: 300_000, requiresHistory: true },
  { label: "15m", windowMs: 900_000, requiresHistory: true },
  { label: "30m", windowMs: 1_800_000, requiresHistory: true },
  { label: "1h", windowMs: 3_600_000, requiresHistory: true },
  { label: "6h", windowMs: 21_600_000, requiresHistory: true },
  { label: "12h", windowMs: 43_200_000, requiresHistory: true },
  { label: "24h", windowMs: 86_400_000, requiresHistory: true },
] as const;

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

  if (liveStream) return <span>{t("liveBadge")}</span>;
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
  chartHistory?: TickerPoint[];
  historicalRangesEnabled?: boolean;
  historyLoading?: boolean;
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
  chartHistory = history,
  historicalRangesEnabled = false,
  historyLoading = false,
  yesterdayPrice = null,
  liveStream = false,
  formatPrice,
  formatDelta,
}: GoldLivePriceProps) {
  const { t, locale } = useLanguage();
  const [unit, setUnit] = useState<GoldUnit>("damlung");
  const [chartWindowMs, setChartWindowMs] = useState(120_000);

  useEffect(() => {
    if (!historyLoading && !historicalRangesEnabled && chartWindowMs > 120_000) {
      setChartWindowMs(120_000);
    }
  }, [chartWindowMs, historicalRangesEnabled, historyLoading]);

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
  const updatedTime = priceUpdatedAt > 0
    ? new Date(priceUpdatedAt).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", second: "2-digit" })
    : "—";

  // Change versus yesterday. Hidden when the backend does not send a usable yesterday price.
  const dayChange = useMemo(() => {
    if (price === null || yesterdayPrice === null || !Number.isFinite(yesterdayPrice) || yesterdayPrice <= 0) {
      return null;
    }
    const diff = Math.round((price - yesterdayPrice) * 100) / 100;
    const dayTrend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    const sign = diff > 0 ? "+" : diff < 0 ? "\u2212" : "";
    const percent = `${sign}${Math.abs((diff / yesterdayPrice) * 100).toFixed(3)}%`;
    return { diff, trend: dayTrend, percent };
  }, [price, yesterdayPrice]);

  return (
    <div className="gold-live" data-trend={trend}>
      <div className="gold-live-controls">
        <span className="gold-live-badge">
          <span
            aria-hidden="true"
            className="gold-live-dot"
            data-active={intervalSeconds > 0 || liveStream ? "true" : undefined}
            data-pulse={animate ? "true" : undefined}
          />
          <span className="gold-live-status"><RefreshStatus fetching={fetching} intervalSeconds={intervalSeconds} liveStream={liveStream} updatedAt={priceUpdatedAt} /></span>
        </span>
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
      </div>

      <LiveTicker
        animate={animate}
        afterPrice={
          <>
            {dayChange && yesterdayPrice !== null && (
              <dl className="gold-market-details">
                <div className="gold-market-detail">
                  <dt>
                    <span aria-hidden="true" className="gold-yesterday-key" />
                    {t("yesterdayPrice")}
                  </dt>
                  <dd>{formatSelectedPrice(yesterdayPrice)}</dd>
                </div>
                <div className="gold-market-detail gold-market-daily-change" data-trend={dayChange.trend}>
                  <dt>{t("dailyGoldChange")}</dt>
                  <dd>
                    {dayChange.trend === "up" ? (
                      <ArrowUpRight aria-hidden="true" size={15} />
                    ) : dayChange.trend === "down" ? (
                      <ArrowDownRight aria-hidden="true" size={15} />
                    ) : (
                      <Minus aria-hidden="true" size={15} />
                    )}
                    <span>
                      {dayChange.diff > 0 ? "+" : dayChange.diff < 0 ? "\u2212" : ""}
                      {formatDelta(convertPrice(Math.abs(dayChange.diff)))}{" "}
                      <small>({dayChange.percent})</small>
                    </span>
                  </dd>
                </div>
              </dl>
            )}
            <div className="gold-live-chart-heading">
              <strong>{t("goldPricePerformance")}</strong>
              <span className="gold-live-chart-updated">
                <Clock3 aria-hidden="true" size={13} />
                {updatedTime}
              </span>
              {dayChange && (
                <span className="gold-live-chart-change" data-trend={dayChange.trend}>
                  {dayChange.trend === "up" ? <ArrowUpRight aria-hidden="true" size={14} /> : dayChange.trend === "down" ? <ArrowDownRight aria-hidden="true" size={14} /> : <Minus aria-hidden="true" size={14} />}
                  {dayChange.percent}
                </span>
              )}
            </div>
          </>
        }
        baseline={yesterdayPrice}
        chartClassName="gold-live-chart"
        chartLabel={t("priceChart")}
        chartWindowMs={chartWindowMs}
        formatPrice={formatSelectedPrice}
        price={price}
        pricePanelClassName="gold-price-focus"
        priceClassName="gold-live-ticker-price"
        series={chartHistory}
        footer={
          <div aria-label={t("goldPricePerformance")} className="gold-live-chart-ranges" role="group">
            {LIVE_RANGES.map((range) => (
              <button
                aria-pressed={chartWindowMs === range.windowMs}
                disabled={range.requiresHistory && !historicalRangesEnabled && !historyLoading}
                key={range.windowMs}
                onClick={() => setChartWindowMs(range.windowMs)}
                type="button"
              >
                {range.label}
              </button>
            ))}
          </div>
        }
        waitingText={t("liveBadge")}
      >
        <div className="gold-live-price-meta">
          <span className="gold-live-unit-label">/ {t(unitLabelKey(unit))}</span>
          {dayChange && dayChange.trend !== "flat" && (
            <span className="gold-trend-chip" data-trend={dayChange.trend} key={animate ? `${dayChange.trend}-${price}` : undefined}>
              {dayChange.trend === "up" ? <ArrowUpRight aria-hidden="true" size={13} /> : <ArrowDownRight aria-hidden="true" size={13} />}
              {dayChange.diff > 0 ? "+" : "\u2212"}{formatDelta(convertPrice(Math.abs(dayChange.diff)))}
            </span>
          )}
        </div>
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
