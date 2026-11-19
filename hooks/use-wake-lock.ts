"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keeps the screen on using the Screen Wake Lock API while `enabled` is true.
 *
 * - The browser drops the lock whenever the page is hidden, so it is requested again on return.
 * - It is also released while Telegram reports the Mini App as deactivated (minimised).
 * - `supported` is false where the API does not exist (some WebViews / older iOS).
 */
export function useWakeLock(enabled: boolean) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "wakeLock" in navigator);
  }, []);

  useEffect(() => {
    if (!enabled || !supported) {
      setActive(false);
      return undefined;
    }

    let cancelled = false;
    let telegramInactive = false;
    const telegram = window.Telegram?.WebApp;

    const release = async () => {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      setActive(false);
      if (sentinel && !sentinel.released) {
        try {
          await sentinel.release();
        } catch {
          // Already released by the browser.
        }
      }
    };

    const request = async () => {
      if (cancelled || document.hidden || telegramInactive || sentinelRef.current) return;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        if (cancelled || telegramInactive) {
          void sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
        setActive(true);
        sentinel.addEventListener("release", () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null;
            setActive(false);
          }
        });
      } catch {
        // Denied (for example low battery mode). The toggle simply shows as inactive.
        setActive(false);
      }
    };

    const onVisibility = () => {
      if (document.hidden) void release();
      else void request();
    };
    const onDeactivated = () => {
      telegramInactive = true;
      void release();
    };
    const onActivated = () => {
      telegramInactive = false;
      void request();
    };

    void request();
    document.addEventListener("visibilitychange", onVisibility);
    telegram?.onEvent?.("activated", onActivated);
    telegram?.onEvent?.("deactivated", onDeactivated);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      telegram?.offEvent?.("activated", onActivated);
      telegram?.offEvent?.("deactivated", onDeactivated);
      void release();
    };
  }, [enabled, supported]);

  return { supported, active };
}
