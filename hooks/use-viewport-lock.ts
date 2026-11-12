"use client";

import { useEffect } from "react";

/**
 * Keeps the Mini App feeling like a native app: no pinch zoom, no double-tap zoom,
 * no ctrl+wheel / keyboard zoom, and no sideways panning of the page.
 * The CSS half of the lock lives under `:root[data-lock="true"]` in globals.css.
 */
export function useViewportLock(): void {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.lock = "true";

    const stop = (event: Event) => {
      if (event.cancelable) event.preventDefault();
    };
    // iOS Safari reports pinch gestures separately from touch events.
    const onGesture = stop;
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) stop(event);
    };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) stop(event);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) stop(event);
    };

    const gestureEvents = ["gesturestart", "gesturechange", "gestureend"] as const;
    gestureEvents.forEach((name) => document.addEventListener(name, onGesture, { passive: false }));
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      delete root.dataset.lock;
      gestureEvents.forEach((name) => document.removeEventListener(name, onGesture));
      document.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
