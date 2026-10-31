"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ACCENTS,
  DEFAULT_APPEARANCE,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  VALID_OPTIONS,
  readAppearance,
  type Appearance,
  type ThemeMode,
} from "@/providers/theme-config";

interface ThemeContextValue {
  appearance: Appearance;
  ready: boolean;
  setPreference: (key: keyof Appearance, value: string | number | boolean) => void;
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAppearance(readAppearance());
    setReady(true);
  }, []);

  const updateAppearance = useCallback((updates: Partial<Appearance>) => {
    setAppearance((current) => {
      const next = { ...current, ...updates };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // Keep the new preferences for this page session when storage is unavailable.
      }
      return next;
    });
  }, []);

  const setPreference = useCallback((key: keyof Appearance, value: string | number | boolean) => {
    if (key === "motion") {
      if (typeof value === "boolean") updateAppearance({ motion: value });
      return;
    }
    if (key === "blur") {
      if (typeof value === "number" && Number.isFinite(value)) {
        updateAppearance({ blur: Math.min(100, Math.max(0, Math.round(value))) });
      }
      return;
    }
    const allowed = VALID_OPTIONS[key];
    if (allowed?.includes(String(value))) updateAppearance({ [key]: value } as Partial<Appearance>);
  }, [updateAppearance]);

  const resetAppearance = useCallback(() => {
    setAppearance(DEFAULT_APPEARANCE);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Reset remains active for this page session when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const applyAppearance = () => {
      const theme = resolveTheme(appearance.mode, telegram, mediaQuery.matches);
      const accent = ACCENTS[appearance.accent] || ACCENTS.neutral;
      const accentColor = theme === "light" ? accent.light : accent.dark;

      const root = document.documentElement;
      root.dataset.theme = theme;
      root.dataset.accent = appearance.accent;
      root.dataset.surface = appearance.surface;
      root.dataset.corners = appearance.corners;
      root.dataset.background = appearance.background;
      root.dataset.animationStyle = appearance.animationStyle;
      root.dataset.layout = appearance.layout;
      root.dataset.motion = appearance.motion ? "on" : "off";
      root.style.setProperty("--accent", accentColor);
      root.style.setProperty("--glass-blur", `${appearance.blur * 0.32}px`);

      const background = theme === "light" ? "#f3f3f3" : "#101112";
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
  }, [appearance]);

  const value = useMemo<ThemeContextValue>(() => ({
    appearance,
    ready,
    setPreference,
    resetAppearance,
  }), [appearance, ready, setPreference, resetAppearance]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
