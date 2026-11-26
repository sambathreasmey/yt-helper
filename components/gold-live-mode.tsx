"use client";

import { ArrowDownRight, ArrowUpRight, Clock3, Radio, Signal, TrendingDown, TrendingUp, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatedNumber } from "@/components/animated-number";
import { GoldBullionArt } from "@/components/gold-bullion-art";
import { GoldIcon } from "@/components/icons/gold-icon";
import { LiveTicker } from "@/components/live-ticker";
import { formatUsd } from "@/features/gold-trading/gold-format";
import { useLiveGoldFeed } from "@/hooks/use-live-gold-feed";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { formatUtcTimestamp } from "@/lib/date-format";
import { setLiveModeActive } from "@/lib/live-mode-state";
import { useLanguage } from "@/providers/language-provider";

const MAX_POINTS = 240;
const LIVE_RANGES = [
  { label: "1m", seconds: 60 },
  { label: "2m", seconds: 120 },
  { label: "4m", seconds: 240 },
] as const;

interface Point {
  t: number;
  p: number;
}

interface GoldLiveModeProps {
  frontendPriceUpdatesEnabled: boolean;
  onOpenChange: (open: boolean) => void;
  price: number | null;
  yesterdayPrice: number | null;
  /** Changes on every successful price refresh (React Query `dataUpdatedAt`). */
  dataUpdatedAt: number;
  updatedOn?: string;
}

type LiveScreenProps = Omit<GoldLiveModeProps, "onOpenChange"> & { onClose: () => void };

function LiveScreen({
  frontendPriceUpdatesEnabled,
  price: polledPrice,
  yesterdayPrice,
  dataUpdatedAt: polledAt,
  updatedOn,
  onClose,
}: LiveScreenProps) {
  const { t, locale } = useLanguage();
  // Prices come straight from the market feed. If it is not reachable, fall back to the server price.
  const feed = useLiveGoldFeed(frontendPriceUpdatesEnabled, 250);
  const feedLive = feed.status === "live" && feed.price !== null;
  const price = feedLive ? feed.price : polledPrice;
  const dataUpdatedAt = feedLive ? (feed.updatedAt ?? 0) : polledAt;
  const formatPrice = useCallback((value: number) => formatUsd(String(value), locale), [locale]);
  const [series, setSeries] = useState<Point[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [rangeSeconds, setRangeSeconds] = useState<(typeof LIVE_RANGES)[number]["seconds"]>(120);

  // Keep the screen on and tell the page to refresh the price faster while this screen is open.
  useWakeLock(true);
  useEffect(() => {
    setLiveModeActive(!feedLive);
  }, [feedLive]);
  // Switch the flag off only when this screen closes (not on every re-render).
  useEffect(() => () => setLiveModeActive(false), []);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // A ticking clock: proves the screen is alive, and drives the "x seconds ago" feeling.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // One chart point per second (the newest value wins).
  useEffect(() => {
    if (price === null || !Number.isFinite(price)) return;
    setSeries((current) => {
      const last = current[current.length - 1];
      const at = Date.now();
      // Ticks can arrive several times a second: keep one chart point per second (the newest value).
      if (last && at - last.t < 1000) return [...current.slice(0, -1), { t: last.t, p: price }];
      return [...current, { t: at, p: price }].slice(-MAX_POINTS);
    });
  }, [price, dataUpdatedAt]);

  const visibleSeries = useMemo(
    () => series.filter((point) => point.t >= now - rangeSeconds * 1000),
    [now, rangeSeconds, series],
  );
  const stats = useMemo(() => {
    if (visibleSeries.length === 0) return null;
    const values = visibleSeries.map((point) => point.p);
    return { high: Math.max(...values), low: Math.min(...values) };
  }, [visibleSeries]);

  // Change since yesterday when the API provides it, otherwise since this screen was opened.
  const baseline = yesterdayPrice !== null && yesterdayPrice > 0 ? yesterdayPrice : series[0]?.p ?? null;
  const change = useMemo(() => {
    if (price === null || baseline === null || baseline <= 0) return null;
    const diff = Math.round((price - baseline) * 100) / 100;
    return {
      trend: diff > 0 ? ("up" as const) : diff < 0 ? ("down" as const) : ("flat" as const),
      diff,
      percent: (diff / baseline) * 100,
    };
  }, [baseline, price]);

  const trend = change?.trend ?? "flat";
  const updatedTime = feedLive && feed.updatedAt
    ? new Date(feed.updatedAt).toLocaleTimeString(locale)
    : updatedOn
      ? formatUtcTimestamp(updatedOn, locale)
      : "—";

  return (
    <div aria-label={t("liveModeTitle")} aria-modal="true" className="live-mode" data-trend={trend} role="dialog">
      <div aria-hidden="true" className="live-mode-map" />
      <div aria-hidden="true" className="live-mode-art">
        <GoldBullionArt />
      </div>
      <div className="live-mode-top">
        <div className="live-mode-status">
          <span className="live-mode-badge">
            <span aria-hidden="true" className="live-mode-dot" />
            {t("liveBadge")}
          </span>
          <Signal aria-hidden="true" className="live-mode-signal" size={18} />
          <span className="live-mode-status-source">{feedLive ? t("landingMarketSource") : t("liveSourcePolling")}</span>
        </div>
        <div className="live-mode-header-actions">
          <div className="live-mode-clock">
            <Clock3 aria-hidden="true" size={17} />
            <span>{new Date(now).toLocaleTimeString(locale)}</span>
            <small>{new Date(now).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}</small>
          </div>
          <button aria-label={t("liveClose")} className="live-mode-close" onClick={onClose} type="button">
            <X aria-hidden="true" size={22} />
          </button>
        </div>
      </div>

      <div className="live-mode-body">
        <div className="live-mode-heading">
          <GoldIcon aria-hidden="true" size={30} />
          <p className="live-mode-label">{t("goldPrice")}</p>
        </div>
        <LiveTicker
          chartLabel={t("priceChart")}
          chartWindowMs={rangeSeconds * 1000}
          formatPrice={formatPrice}
          price={price}
          series={visibleSeries}
          showLastLabel
          waitingText={`${t("liveBadge")}\u2026`}
        >
          <p className="live-mode-unit">/ {t("damlungUnit")}</p>

          {change && (
            <div className="live-mode-change">
              {change.trend !== "flat" &&
                (change.trend === "up" ? <ArrowUpRight aria-hidden="true" size={22} /> : <ArrowDownRight aria-hidden="true" size={22} />)}
              <strong>
                <AnimatedNumber duration={500} format={(value) => formatUsd(String(Math.abs(value)), locale)} value={change.diff} />{" "}
                (
                <AnimatedNumber
                  duration={500}
                  format={(value) => `${value > 0 ? "+" : value < 0 ? "\u2212" : ""}${Math.abs(value).toFixed(2)}%`}
                  value={Math.round(change.percent * 100) / 100}
                />
                )
              </strong>
              <span>{yesterdayPrice !== null && yesterdayPrice > 0 ? t("yesterdayPrice") : t("liveSinceOpened")}</span>
            </div>
          )}
        </LiveTicker>

        <div className="live-mode-stats">
          <div className="live-mode-stat-high">
            <span className="live-mode-stat-icon"><TrendingUp aria-hidden="true" size={19} /></span>
            <span>{t("liveHigh")}</span>
            <strong>{stats ? <AnimatedNumber duration={500} format={formatPrice} value={stats.high} /> : "—"}</strong>
          </div>
          <div className="live-mode-stat-low">
            <span className="live-mode-stat-icon"><TrendingDown aria-hidden="true" size={19} /></span>
            <span>{t("liveLow")}</span>
            <strong>{stats ? <AnimatedNumber duration={500} format={formatPrice} value={stats.low} /> : "—"}</strong>
          </div>
          <div className="live-mode-stat-update">
            <span className="live-mode-stat-icon"><Clock3 aria-hidden="true" size={18} /></span>
            <span>{t("liveUpdatedAt")}</span>
            <strong>{updatedTime}</strong>
          </div>
        </div>

        <div aria-label={t("priceChart")} className="live-mode-ranges" role="group">
          {LIVE_RANGES.map((range) => (
            <button
              aria-pressed={rangeSeconds === range.seconds}
              key={range.seconds}
              onClick={() => setRangeSeconds(range.seconds)}
              type="button"
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Button that opens the full-screen Live mode: a big live price with a live chart. */
export function GoldLiveMode(props: GoldLiveModeProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const openLiveMode = useCallback(() => {
    setOpen(true);
    props.onOpenChange(true);
  }, [props.onOpenChange]);
  const closeLiveMode = useCallback(() => {
    setOpen(false);
    props.onOpenChange(false);
  }, [props.onOpenChange]);

  return (
    <>
      <button className="gold-keep-awake" disabled={props.price === null} onClick={openLiveMode} type="button">
        <Radio aria-hidden="true" size={16} />
        <span>{t("liveModeTitle")}</span>
      </button>
      {open && createPortal(<LiveScreen {...props} onClose={closeLiveMode} />, document.body)}
    </>
  );
}
