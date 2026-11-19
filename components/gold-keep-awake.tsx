"use client";

import { Sun, SunDim } from "lucide-react";
import { useEffect, useState } from "react";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { useLanguage } from "@/providers/language-provider";

const STORAGE_KEY = "gold-keep-screen-on";

/** Small switch that keeps the screen awake while the gold trading page is open. On by default. */
export function GoldKeepAwake() {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(true);
  const { supported, active } = useWakeLock(enabled);

  // Read the saved choice after mount so server and client markup match.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "off") setEnabled(false);
    } catch {
      // Storage can be unavailable; keep the default.
    }
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // Ignore storage errors.
    }
  };

  const Icon = enabled && active ? Sun : SunDim;

  return (
    <button
      aria-checked={enabled && supported}
      className="gold-keep-awake"
      data-active={enabled && active ? "true" : "false"}
      disabled={!supported}
      onClick={toggle}
      role="switch"
      type="button"
    >
      <Icon aria-hidden="true" size={16} />
      <span>{supported ? t("keepScreenOn") : t("keepScreenOnUnsupported")}</span>
      {supported && <span aria-hidden="true" className="gold-keep-awake-switch" />}
    </button>
  );
}
