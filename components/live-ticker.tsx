"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface TickerPoint {
  t: number;
  p: number;
}

interface LiveTickerProps {
  /** Latest price (the target the display glides to). */
  price: number | null;
  /** Price history, about one point per second, oldest first. */
  series: TickerPoint[];
  formatPrice: (value: number) => string;
  /** Shown instead of the chart until there is something to draw. */
  waitingText: string;
  chartLabel?: string;
  chartWindowMs?: number;
  showLastLabel?: boolean;
  /** Rendered between the big price and the chart (unit label, change chip...). */
  children?: ReactNode;
}

/** Default history window; callers can choose a shorter or longer live-session window. */
const WINDOW_MS = 120_000;
/** Right after opening the chart is zoomed in, so a few seconds of data already fill the width. */
const MIN_WINDOW_MS = 20_000;
/** The oldest point is kept this far from the left edge (in chart %), where the line fades out. */
const OLDEST_X = 8;
/** The newest value sits this far from the right edge, so the dot has room. */
const HEAD_X = 96;
/** The price glides to a new value with this time constant (about 95% of the way in 3x this). */
const PRICE_TAU_MS = 170;
/**
 * The vertical scale follows the data: it widens quickly (so the line never runs off the chart) and
 * narrows slowly (so the chart does not breathe or jump when an old high or low leaves the window).
 */
const SCALE_WIDEN_TAU_MS = 120;
const SCALE_NARROW_TAU_MS = 700;

const fmt = (value: number) => (Math.round(value * 100) / 100).toString();

/** Curve through the points: quadratic segments that end at the midpoints, so it never overshoots. */
function smoothLine(points: { x: number; y: number }[]): string {
  let d = `M${fmt(points[0].x)} ${fmt(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    const my = (points[i].y + points[i + 1].y) / 2;
    d += ` Q${fmt(points[i].x)} ${fmt(points[i].y)} ${fmt(mx)} ${fmt(my)}`;
  }
  const last = points[points.length - 1];
  return `${d} L${fmt(last.x)} ${fmt(last.y)}`;
}

/**
 * The big live price and the live chart.
 * A single animation loop drives both and writes straight to the DOM (no React render per frame), so:
 *  - the price glides smoothly to every new value instead of jumping,
 *  - the chart scrolls with real time, and its newest point moves in step with the price,
 *  - the vertical scale eases, so a new high or low does not make the line jump.
 */
export function LiveTicker({
  price,
  series,
  formatPrice,
  waitingText,
  chartLabel,
  chartWindowMs,
  showLastLabel = false,
  children,
}: LiveTickerProps) {
  const gradientId = useId();
  const priceRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const priceTarget = useRef(price);
  const seriesRef = useRef(series);
  const formatRef = useRef(formatPrice);
  const windowTarget = useRef(chartWindowMs ?? WINDOW_MS);
  const dirty = useRef(true);
  const displayed = useRef<number | null>(price);
  const shownCents = useRef<number | null>(null);
  const [initialText] = useState(() => (price === null ? "\u2014" : formatPrice(price)));

  priceTarget.current = price;
  seriesRef.current = series;
  formatRef.current = formatPrice;
  windowTarget.current = chartWindowMs ?? WINDOW_MS;
  dirty.current = true;

  // Restart the CSS flash (green up / red down) when the price moves, without remounting the node.
  const previousPrice = useRef(price);
  useEffect(() => {
    const element = priceRef.current;
    const before = previousPrice.current;
    previousPrice.current = price;
    if (!element || price === null || before === null || before === price) return;
    element.removeAttribute("data-flash");
    void element.offsetWidth;
    element.dataset.flash = price > before ? "up" : "down";
  }, [price]);

  // Re-format straight away after a language change.
  useEffect(() => {
    shownCents.current = null;
    dirty.current = true;
  }, [formatPrice]);

  useEffect(() => {
    let raf = 0;
    let lastTs = 0;
    let yMin: number | null = null;
    let yMax: number | null = null;
    // Lite mode draws fewer frames; motion-off draws only when something changed.
    const minInterval = () => (document.documentElement.dataset.perf === "lite" ? 33 : 0);
    const reduceMotion = () =>
      document.documentElement.dataset.motion === "off" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const frame = (ts: number) => {
      raf = window.requestAnimationFrame(frame);
      const reduce = reduceMotion();
      if (reduce && !dirty.current) return;
      if (lastTs && ts - lastTs < minInterval()) return;
      const dt = lastTs ? Math.min(100, ts - lastTs) : 16;
      lastTs = ts;
      dirty.current = false;

      const target = priceTarget.current;
      if (target === null) return;

      // 1. The price glides toward the newest value.
      let shown = displayed.current;
      if (shown === null || reduce) {
        shown = target;
      } else {
        shown += (target - shown) * (1 - Math.exp(-dt / PRICE_TAU_MS));
        if (Math.abs(target - shown) < 0.0005) shown = target;
      }
      displayed.current = shown;

      const cents = Math.round(shown * 100);
      if (cents !== shownCents.current) {
        shownCents.current = cents;
        const formattedPrice = formatRef.current(shown);
        if (priceRef.current) priceRef.current.textContent = formattedPrice;
        if (labelRef.current) labelRef.current.textContent = formattedPrice;
      }

      // 2. The chart: a window that slides with time, ending at the gliding price.
      const line = lineRef.current;
      const area = areaRef.current;
      const dot = dotRef.current;
      const points = seriesRef.current;
      if (!line || !area || !dot || points.length < 2) return;

      const now = Date.now();
      // The window grows with the data (so the line always fills the chart) until it reaches its maximum.
      const maxWindowMs = windowTarget.current;
      const minWindowMs = Math.min(MIN_WINDOW_MS, maxWindowMs);
      const windowMs = Math.min(maxWindowMs, Math.max(minWindowMs, (now - points[0].t) * (100 / (HEAD_X - OLDEST_X))));
      const left = now - windowMs * (HEAD_X / 100);
      const xOf = (t: number) => ((t - left) / windowMs) * 100;

      // Keep one point before the left edge so the line enters smoothly from outside.
      let first = points.findIndex((point) => point.t >= left);
      if (first === -1) first = points.length - 1;
      if (first > 0) first -= 1;
      let visible = points.slice(first);
      // The newest point is the price the display is still gliding to: the gliding head replaces it,
      // otherwise the line would shoot up to the new value and come back down to the head.
      const newest = points[points.length - 1];
      if (now - newest.t < 1500) visible = visible.filter((point) => point !== newest);

      let lo = shown;
      let hi = shown;
      for (const point of visible) {
        if (point.p < lo) lo = point.p;
        if (point.p > hi) hi = point.p;
      }
      const pad = hi === lo ? Math.max(hi * 0.0008, 0.01) : (hi - lo) * 0.18;
      const wantMin = lo - pad;
      const wantMax = hi + pad;
      if (yMin === null || yMax === null || reduce) {
        yMin = wantMin;
        yMax = wantMax;
      } else {
        const kMin = 1 - Math.exp(-dt / (wantMin < yMin ? SCALE_WIDEN_TAU_MS : SCALE_NARROW_TAU_MS));
        const kMax = 1 - Math.exp(-dt / (wantMax > yMax ? SCALE_WIDEN_TAU_MS : SCALE_NARROW_TAU_MS));
        yMin += (wantMin - yMin) * kMin;
        yMax += (wantMax - yMax) * kMax;
      }
      const span = yMax - yMin || 1;
      const yOf = (p: number) => 100 - ((p - yMin!) / span) * 100;

      const coords = visible.map((point) => ({ x: xOf(point.t), y: yOf(point.p) }));
      const head = { x: HEAD_X, y: yOf(shown) };
      coords.push(head);
      if (coords.length < 2) return;

      const d = smoothLine(coords);
      line.setAttribute("d", d);
      area.setAttribute("d", `${d} L${fmt(head.x)} 100 L${fmt(coords[0].x)} 100 Z`);
      dot.style.left = `${head.x}%`;
      dot.style.top = `${head.y}%`;
      if (labelRef.current) {
        labelRef.current.style.left = `${head.x}%`;
        labelRef.current.style.top = `${head.y}%`;
      }
      dot.dataset.ready = "1";
    };

    raf = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <p className="live-mode-price" ref={priceRef}>
        {initialText}
      </p>
      {children}
      <div aria-label={chartLabel} className="live-mode-chart" role={chartLabel ? "img" : undefined}>
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
          <path fill={`url(#${gradientId})`} ref={areaRef} />
          <path className="live-mode-line" ref={lineRef} />
        </svg>
        <span aria-hidden="true" className="live-mode-last" ref={dotRef} />
        {showLastLabel && <span aria-hidden="true" className="live-mode-last-label" ref={labelRef} />}
        {series.length < 2 && <p className="live-mode-waiting">{waitingText}</p>}
      </div>
    </>
  );
}
