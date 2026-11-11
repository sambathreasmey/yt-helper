"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ANIMATION_SPEED,
  DEFAULT_APPEARANCE,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  TEXT_SCALE,
  VALID_OPTIONS,
  clampPercent,
  isHexColor,
  isLowEndDevice,
  isRefreshInterval,
  readAppearance,
  resolveAccentColor,
  type Appearance,
  type ThemeMode,
} from "@/providers/theme-config";

interface ThemeContextValue {
  appearance: Appearance;
  ready: boolean;
  /** True when the lighter rendering path (no blur, no ambient animation) is active. */
  lite: boolean;
  setPreference: (key: keyof Appearance, value: string | number | boolean) => void;
  applyPreset: (values: Partial<Appearance>) => void;
  resetAppearance: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(
  mode: ThemeMode,
  telegram: { colorScheme?: string } | undefined,
  prefersLight: boolean,
): "light" | "dark" {
  if (mode === "light" || mode === "dark") return mode;
  return telegram?.colorScheme === "light" || (!telegram?.colorScheme && prefersLight)
    ? "light"
    : "dark";
}

function rgbChannels(hex: string): string {
  const value = hex.replace("#", "");
  const normalized = value.length === 3
    ? value.split("").map((part) => `${part}${part}`).join("")
    : value;
  const number = Number.parseInt(normalized, 16);
  return `${(number >> 16) & 255} ${(number >> 8) & 255} ${number & 255}`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false);
  const [lowEnd, setLowEnd] = useState(false);

  useEffect(() => {
    setAppearance(readAppearance());
    setLowEnd(isLowEndDevice());
    setReady(true);
  }, []);

  // Persist after a short pause so dragging a slider does not write storage on every tick.
  useEffect(() => {
    if (!ready) return undefined;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // Keep the preferences for this page session when storage is unavailable.
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [appearance, ready]);

  const setPreference = useCallback((key: keyof Appearance, value: string | number | boolean) => {
    setAppearance((current) => {
      let next: Appearance | null = null;
      if (key === "motion" || key === "priceAnimation" || key === "haptics") {
        if (typeof value === "boolean") next = { ...current, [key]: value };
      } else if (key === "blur" || key === "backgroundIntensity") {
        if (typeof value === "number" && Number.isFinite(value)) next = { ...current, [key]: clampPercent(value) };
      } else if (key === "refreshInterval") {
        if (isRefreshInterval(value)) next = { ...current, refreshInterval: value };
      } else if (key === "customAccent") {
        if (isHexColor(value)) next = { ...current, customAccent: value, accent: "custom" };
      } else if (VALID_OPTIONS[key]?.includes(String(value))) {
        next = { ...current, [key]: value } as Appearance;
      }
      return next ?? current;
    });
  }, []);

  const applyPreset = useCallback((values: Partial<Appearance>) => {
    setAppearance((current) => ({ ...current, ...values }));
  }, []);

  const resetAppearance = useCallback(() => setAppearance(DEFAULT_APPEARANCE), []);

  const lite = appearance.performance === "lite" || (appearance.performance === "auto" && lowEnd);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const applyAppearance = () => {
      const theme = resolveTheme(appearance.mode, telegram, mediaQuery.matches);
      const accentColor = resolveAccentColor(appearance, theme);

      const root = document.documentElement;
      root.dataset.theme = theme;
      root.dataset.accent = appearance.accent;
      root.dataset.surface = appearance.surface;
      root.dataset.corners = appearance.corners;
      root.dataset.background = appearance.background;
      root.dataset.animationStyle = appearance.animationStyle;
      root.dataset.layout = appearance.layout;
      root.dataset.width = appearance.contentWidth;
      root.dataset.density = appearance.density;
      root.dataset.textSize = appearance.textSize;
      root.dataset.motion = appearance.motion ? "on" : "off";
      root.dataset.perf = lite ? "lite" : "full";
      root.dataset.haptics = appearance.haptics ? "on" : "off";
      root.dataset.bgDim = appearance.backgroundIntensity < 100 ? "true" : "false";
      root.style.setProperty("--accent", accentColor);
      root.style.setProperty("--accent-rgb", rgbChannels(accentColor));
      root.style.setProperty("--glass-blur", `${appearance.blur * 0.32}px`);
      root.style.setProperty("--speed", String(ANIMATION_SPEED[appearance.animationSpeed]));
      root.style.setProperty("--bg-opacity", String(appearance.backgroundIntensity / 100));
      root.style.fontSize = TEXT_SCALE[appearance.textSize];

      const background = theme === "light" ? "#f3f7fb" : "#0a1424";
      for (const method of ["setHeaderColor", "setBackgroundColor", "setBottomBarColor"] as const) {
        try {
          telegram?.[method]?.(background);
        } catch {
          // Not all Telegram clients expose every color method.
        }
      }
    };

    applyAppearance();
    mediaQuery.addEventListener?.("change", applyAppearance);
    telegram?.onEvent?.("themeChanged", applyAppearance);

    return () => {
      mediaQuery.removeEventListener?.("change", applyAppearance);
      telegram?.offEvent?.("themeChanged", applyAppearance);
    };
  }, [appearance, lite]);

  // Pause ambient animation while the app is in the background to save battery.
  useEffect(() => {
    const syncVisibility = () => {
      document.documentElement.dataset.paused = document.hidden ? "true" : "false";
    };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    appearance,
    ready,
    lite,
    setPreference,
    applyPreset,
    resetAppearance,
  }), [appearance, ready, lite, setPreference, applyPreset, resetAppearance]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
