"use client";

import { ArrowDownRight, ArrowUpRight, Radio, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatUsd } from "@/features/gold-trading/gold-format";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { formatUtcTimestamp } from "@/lib/date-format";
import { setLiveModeActive } from "@/lib/live-mode-state";
import { useLanguage } from "@/providers/language-provider";

const MAX_POINTS = 240;
/** The chart always spans at least this long, so the first few points do not jump around. */
const MIN_SPAN_MS = 60_000;

interface Point {
  t: number;
  p: number;
}

interface GoldLiveModeProps {
  price: number | null;
  yesterdayPrice: number | null;
  /** Changes on every successful price refresh (React Query `dataUpdatedAt`). */
  dataUpdatedAt: number;
  updatedOn?: string;
}

function LiveScreen({ price, yesterdayPrice, dataUpdatedAt, updatedOn, onClose }: GoldLiveModeProps & { onClose: () => void }) {
  const { t, locale } = useLanguage();
  const gradientId = useId();
  const [series, setSeries] = useState<Point[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState<{ key: number; dir: "up" | "down" } | null>(null);

  // Keep the screen on and tell the page to refresh the price faster while this screen is open.
  useWakeLock(true);
  useEffect(() => {
    setLiveModeActive(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      setLiveModeActive(false);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // A ticking clock: proves the screen is alive, and drives the "x seconds ago" feeling.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // One point per successful refresh; flash green/red when the price moves.
  useEffect(() => {
    if (price === null || !Number.isFinite(price)) return;
    setSeries((current) => {
      const last = current[current.length - 1];
      if (last && last.p !== price) setFlash({ key: Date.now(), dir: price > last.p ? "up" : "down" });
      return [...current, { t: Date.now(), p: price }].slice(-MAX_POINTS);
    });
  }, [price, dataUpdatedAt]);

  const stats = useMemo(() => {
    if (series.length === 0) return null;
    const values = series.map((point) => point.p);
    return { high: Math.max(...values), low: Math.min(...values), first: values[0] };
  }, [series]);

  // Change since yesterday when the API provides it, otherwise since this screen was opened.
  const baseline = yesterdayPrice !== null && yesterdayPrice > 0 ? yesterdayPrice : stats?.first ?? null;
  const change = useMemo(() => {
    if (price === null || baseline === null || baseline <= 0) return null;
    const diff = Math.round((price - baseline) * 100) / 100;
    const sign = diff > 0 ? "+" : diff < 0 ? "\u2212" : "";
    return {
      trend: diff > 0 ? ("up" as const) : diff < 0 ? ("down" as const) : ("flat" as const),
      amount: formatUsd(String(Math.abs(diff)), locale),
      percent: `${sign}${Math.abs((diff / baseline) * 100).toFixed(2)}%`,
    };
  }, [baseline, locale, price]);

  const chart = useMemo(() => {
    if (series.length < 2 || !stats) return null;
    const t0 = series[0].t;
    const span = Math.max(series[series.length - 1].t - t0, MIN_SPAN_MS);
    const range = stats.high - stats.low;
    const pad = range === 0 ? Math.max(stats.high * 0.001, 0.01) : range * 0.18;
    const min = stats.low - pad;
    const max = stats.high + pad;
    const coords = series.map((point) => ({
      x: ((point.t - t0) / span) * 100,
      y: 100 - ((point.p - min) / (max - min)) * 100,
    }));
    const line = coords.map((c, index) => `${index === 0 ? "M" : "L"}${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" ");
    const last = coords[coords.length - 1];
    return { line, area: `${line} L${last.x.toFixed(2)} 100 L0 100 Z`, last };
  }, [series, stats]);

  const trend = change?.trend ?? "flat";

  return (
    <div aria-label={t("liveModeTitle")} aria-modal="true" className="live-mode" data-trend={trend} role="dialog">
      <div className="live-mode-top">
        <span className="live-mode-badge">
          <span aria-hidden="true" className="live-mode-dot" />
          {t("liveBadge")}
        </span>
        <span className="live-mode-clock">{new Date(now).toLocaleTimeString(locale)}</span>
      </div>

      <div className="live-mode-body">
        <p className="live-mode-label">{t("goldPrice")}</p>
        <p className="live-mode-price" data-flash={flash?.dir ?? "none"} key={flash?.key ?? "initial"}>
          {price === null ? "\u2014" : formatUsd(String(price), locale)}
        </p>
        <p className="live-mode-unit">/ {t("damlungUnit")}</p>

        {change && (
          <div className="live-mode-change">
            {change.trend !== "flat" &&
              (change.trend === "up" ? <ArrowUpRight aria-hidden="true" size={22} /> : <ArrowDownRight aria-hidden="true" size={22} />)}
            <strong>
              {change.amount} ({change.percent})
            </strong>
            <span>{yesterdayPrice !== null && yesterdayPrice > 0 ? t("yesterdayPrice") : t("liveSinceOpened")}</span>
          </div>
        )}

        <div className="live-mode-chart">
          {chart ? (
            <>
              <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[25, 50, 75].map((y) => (
                  <line className="live-mode-grid" key={y} x1="0" x2="100" y1={y} y2={y} />
                ))}
                <path d={chart.area} fill={`url(#${gradientId})`} />
                <path className="live-mode-line" d={chart.line} />
              </svg>
              <span aria-hidden="true" className="live-mode-last" style={{ left: `${chart.last.x}%`, top: `${chart.last.y}%` }} />
            </>
          ) : (
            <p className="live-mode-waiting">{t("liveBadge")}…</p>
          )}
        </div>

        {stats && (
          <div className="live-mode-stats">
            <div>
              <span>{t("liveHigh")}</span>
              <strong>{formatUsd(String(stats.high), locale)}</strong>
            </div>
            <div>
              <span>{t("liveLow")}</span>
              <strong>{formatUsd(String(stats.low), locale)}</strong>
            </div>
          </div>
        )}

        {updatedOn && <p className="live-mode-updated">{t("updated", { date: formatUtcTimestamp(updatedOn, locale) })}</p>}
      </div>

      <button aria-label={t("liveClose")} className="live-mode-close" onClick={onClose} type="button">
        <X aria-hidden="true" size={22} />
      </button>
    </div>
  );
}

/** Button that opens the full-screen Live mode: a big live price with a live chart. */
export function GoldLiveMode(props: GoldLiveModeProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="gold-keep-awake" disabled={props.price === null} onClick={() => setOpen(true)} type="button">
        <Radio aria-hidden="true" size={16} />
        <span>{t("liveModeTitle")}</span>
      </button>
      {open && createPortal(<LiveScreen {...props} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}
