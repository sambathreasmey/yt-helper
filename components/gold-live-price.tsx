"use client";

import { memo, useEffect, useId, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { cn } from "@/lib/utils";
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
}: {
  updatedAt: number;
  intervalSeconds: number;
  fetching: boolean;
}) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (intervalSeconds === 0) return undefined;
    setNow(Date.now());
    const timer = window.setInterval(() => {
      if (!document.hidden) setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [intervalSeconds, updatedAt]);

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
  formatPrice: (value: number) => string;
  formatDelta: (value: number) => string;
  onRefresh: () => void;
}

export const GoldLivePrice = memo(function GoldLivePrice({
  price,
  priceUpdatedAt,
  intervalSeconds,
  fetching,
  animate,
  history,
  formatPrice,
  formatDelta,
  onRefresh,
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

  return (
    <div className="gold-live" data-trend={trend}>
      <div className="flex items-center justify-between gap-2">
        <span className="gold-live-badge">
          <span aria-hidden="true" className="gold-live-dot" data-active={intervalSeconds > 0 ? "true" : undefined} />
          {t("liveBadge")}
          <span className="gold-live-status"><RefreshStatus fetching={fetching} intervalSeconds={intervalSeconds} updatedAt={priceUpdatedAt} /></span>
        </span>
        <button
          aria-label={t("refreshNow")}
          className="gold-live-refresh"
          disabled={fetching}
          onClick={onRefresh}
          title={t("refreshNow")}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={cn(fetching && "animate-spin")} size={14} />
        </button>
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

      {intervalSeconds > 0 && (
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
