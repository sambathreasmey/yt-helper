"use client";

import { ArrowDown, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/language-provider";
import { impactTelegram } from "@/services/telegram-client";

const THRESHOLD = 70; // px the content must travel before release triggers a refresh
const MAX_PULL = 130;
const HOLD = 56; // where the content rests while refreshing
const RESISTANCE = 0.5;
const MIN_SPIN_MS = 650;

type Phase = "idle" | "pull" | "ready" | "loading";

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown> | void;
  disabled?: boolean;
  children: ReactNode;
}

function hasScrolledAncestor(target: EventTarget | null): boolean {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollTop > 0) return true;
    node = node.parentElement;
  }
  return false;
}

/** Mobile-style pull-down-to-refresh. Frames are written straight to the DOM, so dragging never re-renders React. */
export function PullToRefresh({ onRefresh, disabled = false, children }: PullToRefreshProps) {
  const { t } = useLanguage();
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  const updatePhase = useCallback((next: Phase) => {
    if (phaseRef.current === next) return;
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const paint = useCallback((distance: number, animate: boolean) => {
    const content = contentRef.current;
    const indicator = indicatorRef.current;
    if (!content || !indicator) return;
    content.classList.toggle("ptr-animate", animate);
    indicator.classList.toggle("ptr-animate", animate);
    content.style.transform = distance > 0 ? `translate3d(0, ${distance}px, 0)` : "";
    const progress = Math.min(1, distance / THRESHOLD);
    indicator.style.opacity = String(distance > 4 ? Math.max(progress, phaseRef.current === "loading" ? 1 : 0) : 0);
    indicator.style.setProperty("--ptr-y", `${Math.max(0, distance - 44)}px`);
    indicator.style.setProperty("--ptr-rotate", `${progress * 180}deg`);
  }, []);

  useEffect(() => {
    if (disabled) return undefined;
    let startY = 0;
    let startX = 0;
    let tracking = false;
    let pulling = false;
    let distance = 0;

    const reset = () => {
      tracking = false;
      pulling = false;
      distance = 0;
      updatePhase("idle");
      paint(0, true);
    };

    const onStart = (event: TouchEvent) => {
      if (phaseRef.current === "loading" || event.touches.length !== 1) return;
      if (window.scrollY > 0 || document.documentElement.dataset.sheet === "open") return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [data-no-ptr]")) return;
      if (hasScrolledAncestor(target)) return;
      startY = event.touches[0].clientY;
      startX = event.touches[0].clientX;
      tracking = true;
      pulling = false;
    };

    const onMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return;
      const dy = event.touches[0].clientY - startY;
      const dx = event.touches[0].clientX - startX;
      if (!pulling) {
        // Wait for a clearly vertical downward drag so taps and sideways swipes are untouched.
        if (dy < 8 || Math.abs(dx) > dy) {
          if (dy < -4 || Math.abs(dx) > 12) tracking = false;
          return;
        }
        pulling = true;
      }
      if (window.scrollY > 0) {
        reset();
        return;
      }
      if (event.cancelable) event.preventDefault();
      distance = Math.min(MAX_PULL, (dy - 8) * RESISTANCE);
      if (distance >= THRESHOLD && phaseRef.current !== "ready") {
        if (document.documentElement.dataset.haptics !== "off") impactTelegram(window.Telegram?.WebApp, "light");
        updatePhase("ready");
      } else if (distance < THRESHOLD && phaseRef.current !== "pull") {
        updatePhase("pull");
      }
      paint(distance, false);
    };

    const onEnd = async () => {
      if (!tracking && !pulling) return;
      const shouldRefresh = pulling && distance >= THRESHOLD;
      tracking = false;
      pulling = false;
      if (!shouldRefresh) {
        reset();
        return;
      }
      updatePhase("loading");
      paint(HOLD, true);
      const startedAt = Date.now();
      try {
        await refreshRef.current();
      } catch {
        // Failed queries show their own error state; just stop the spinner.
      }
      const remaining = MIN_SPIN_MS - (Date.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => window.setTimeout(resolve, remaining));
      reset();
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [disabled, paint, updatePhase]);

  const label = phase === "loading" ? t("refreshing") : phase === "ready" ? t("releaseToRefresh") : t("pullToRefresh");

  return (
    <>
      <div aria-live="polite" className="ptr-indicator" ref={indicatorRef}>
        <span className={cn("ptr-chip", phase === "ready" && "ptr-chip-ready")}>
          {phase === "loading"
            ? <RefreshCw aria-hidden="true" className="animate-spin" size={15} />
            : <ArrowDown aria-hidden="true" className="ptr-arrow" size={15} />}
          <span>{label}</span>
        </span>
      </div>
      <div className="ptr-content" ref={contentRef}>{children}</div>
    </>
  );
}
