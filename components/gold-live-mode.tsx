"use client";

import { ArrowDownRight, ArrowUpRight, Radio, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatedNumber } from "@/components/animated-number";
import { LiveTicker } from "@/components/live-ticker";
import { formatUsd } from "@/features/gold-trading/gold-format";
import { useLiveGoldFeed } from "@/hooks/use-live-gold-feed";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { formatUtcTimestamp } from "@/lib/date-format";
import { setLiveModeActive } from "@/lib/live-mode-state";
import { useLanguage } from "@/providers/language-provider";

const MAX_POINTS = 240;

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

function LiveScreen({
  price: polledPrice,
  yesterdayPrice,
  dataUpdatedAt: polledAt,
  updatedOn,
  onClose,
}: GoldLiveModeProps & { onClose: () => void }) {
  const { t, locale } = useLanguage();
  // Prices come straight from the market feed. If it is not reachable, fall back to the server price.
  const feed = useLiveGoldFeed(true);
  const feedLive = feed.status === "live" && feed.price !== null;
  const price = feedLive ? feed.price : polledPrice;
  const dataUpdatedAt = feedLive ? (feed.updatedAt ?? 0) : polledAt;
  const formatPrice = useCallback((value: number) => formatUsd(String(value), locale), [locale]);
  const [series, setSeries] = useState<Point[]>([]);
  const [now, setNow] = useState(() => Date.now());

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
    return {
      trend: diff > 0 ? ("up" as const) : diff < 0 ? ("down" as const) : ("flat" as const),
      diff,
      percent: (diff / baseline) * 100,
    };
  }, [baseline, price]);

  const trend = change?.trend ?? "flat";

  return (
    <div aria-label={t("liveModeTitle")} aria-modal="true" className="live-mode" data-trend={trend} role="dialog">
      <div className="live-mode-top">
        <span className="live-mode-badge">
          <span aria-hidden="true" className="live-mode-dot" />
          {t("liveBadge")}
        </span>
        <span className="live-mode-clock">
          {new Date(now).toLocaleTimeString(locale)}
          <small>{feedLive ? t("liveSourceFeed") : t("liveSourcePolling")}</small>
        </span>
      </div>

      <div className="live-mode-body">
        <p className="live-mode-label">{t("goldPrice")}</p>
        <LiveTicker formatPrice={formatPrice} price={price} series={series} waitingText={`${t("liveBadge")}\u2026`}>
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

        {stats && (
          <div className="live-mode-stats">
            <div>
              <span>{t("liveHigh")}</span>
              <strong><AnimatedNumber duration={500} format={formatPrice} value={stats.high} /></strong>
            </div>
            <div>
              <span>{t("liveLow")}</span>
              <strong><AnimatedNumber duration={500} format={formatPrice} value={stats.low} /></strong>
            </div>
          </div>
        )}

        {feedLive && feed.updatedAt ? (
          <p className="live-mode-updated">{t("updated", { date: new Date(feed.updatedAt).toLocaleTimeString(locale) })}</p>
        ) : (
          updatedOn && <p className="live-mode-updated">{t("updated", { date: formatUtcTimestamp(updatedOn, locale) })}</p>
        )}
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
