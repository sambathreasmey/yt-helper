"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  /** Turn the count-up and the up/down colour flash off. */
  animate?: boolean;
  duration?: number;
  className?: string;
}

/**
 * Counts from the previous value to the new one and flashes green/red on a change.
 * Frames write straight to the DOM node, so a tween never re-renders React.
 */
export function AnimatedNumber({ value, format, animate = true, duration = 700, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  const formatRef = useRef(format);
  const running = useRef(false);
  const [initialText] = useState(() => format(value));
  formatRef.current = format;

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const from = shown.current;
    if (from === value) return undefined;

    const reduceMotion = document.documentElement.dataset.motion === "off"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduceMotion || !Number.isFinite(from) || !Number.isFinite(value)) {
      shown.current = value;
      element.removeAttribute("data-flash");
      element.textContent = formatRef.current(value);
      return undefined;
    }

    // Restart the CSS flash by toggling the attribute (forcing a reflow in between).
    // This avoids a React re-render, and a changing `key` would remount the node mid-tween.
    element.removeAttribute("data-flash");
    void element.offsetWidth;
    element.dataset.flash = value > from ? "up" : "down";
    running.current = true;
    // Time the tween from the first frame's own timestamp so it never depends on how
    // performance.now() and the animation-frame clock line up.
    let startedAt: number | null = null;
    let frame = 0;
    const step = (now: number) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
      const eased = 1 - (1 - progress) ** 3;
      shown.current = progress < 1 ? from + (value - from) * eased : value;
      element.textContent = formatRef.current(shown.current);
      if (progress < 1) frame = window.requestAnimationFrame(step);
      else running.current = false;
    };
    frame = window.requestAnimationFrame(step);
    const clearFlash = window.setTimeout(() => element.removeAttribute("data-flash"), 1600);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(clearFlash);
      running.current = false;
    };
  }, [animate, duration, value]);

  // Re-format (for example after a language change) when no tween is running.
  useEffect(() => {
    if (!running.current && ref.current) ref.current.textContent = format(shown.current);
  }, [format]);

  return (
    <span
      className={cn("number-flash tabular-nums", className)}
      ref={ref}
    >
      {initialText}
    </span>
  );
}
