"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/** Short confirmation message above the bottom bar. Clears itself after `duration` ms. */
export function AppToast({ message, onDone, duration = 3400 }: { message: string; onDone: () => void; duration?: number }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onDone, duration);
    return () => window.clearTimeout(timer);
  }, [message, onDone, duration]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div aria-live="polite" className="app-toast" data-visible={message ? "true" : "false"} role="status">
      {message}
    </div>,
    document.body,
  );
}
