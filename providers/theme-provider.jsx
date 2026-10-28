"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "yt-helper-appearance";
const LEGACY_STORAGE_KEY = "yt-helper-theme";

export const DEFAULT_APPEARANCE = {
  mode: "system",
  accent: "neutral",
  surface: "glass",
  corners: "soft",
  blur: 70,
  background: "aurora",
  animationStyle: "float",
  layout: "stacked",
  appIcon: "circle-play",
  motion: true,
};

const ACCENTS = {
  neutral: { light: "#27272a", dark: "#e4e4e7" },
  rose: { light: "#be526c", dark: "#f29ab0" },
  lavender: { light: "#7657b7", dark: "#c5a6ff" },
  mint: { light: "#26836b", dark: "#7ed8ba" },
  ocean: { light: "#3975ad", dark: "#8ec7ff" },
  peach: { light: "#b86b43", dark: "#ffb489" },
};

const VALID_OPTIONS = {
  mode: ["system", "light", "dark"],
  accent: Object.keys(ACCENTS),
  surface: ["glass", "solid"],
  corners: ["soft", "rounded", "sharp"],
  background: [
    "aurora", "drift", "cute", "petals", "bubbles", "stars",
    "clouds", "confetti", "hearts", "waves", "galaxy", "none",
  ],
  animationStyle: ["float", "breathe", "twinkle", "orbit", "wave", "none"],
  layout: ["stacked", "compact", "dashboard", "gallery"],
  appIcon: ["circle-play", "play", "film", "clapperboard", "headphones"],
};

const ThemeContext = createContext(null);

function readAppearance() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return DEFAULT_APPEARANCE;
      return {
        ...DEFAULT_APPEARANCE,
        ...Object.fromEntries(
          Object.entries(VALID_OPTIONS)
            .filter(([key, values]) => values.includes(parsed[key]))
            .map(([key]) => [key, parsed[key]]),
        ),
        blur: Number.isFinite(parsed.blur)
          ? Math.min(100, Math.max(0, Math.round(parsed.blur)))
          : DEFAULT_APPEARANCE.blur,
        motion: typeof parsed.motion === "boolean" ? parsed.motion : DEFAULT_APPEARANCE.motion,
      };
    }

    const legacyMode = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (VALID_OPTIONS.mode.includes(legacyMode)) {
      return { ...DEFAULT_APPEARANCE, mode: legacyMode };
    }
  } catch {
    return DEFAULT_APPEARANCE;
  }
  return DEFAULT_APPEARANCE;
}

function resolveTheme(mode, telegram, prefersLight) {
  if (mode === "light" || mode === "dark") return mode;
  return telegram?.colorScheme === "light" || (!telegram?.colorScheme && prefersLight)
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }) {
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAppearance(readAppearance());
    setReady(true);
  }, []);

  const updateAppearance = useCallback((updates) => {
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

  const setPreference = useCallback((key, value) => {
    if (key === "motion") {
      if (typeof value === "boolean") updateAppearance({ motion: value });
      return;
    }
    if (key === "blur") {
      if (Number.isFinite(value)) updateAppearance({ blur: Math.min(100, Math.max(0, Math.round(value))) });
      return;
    }
    if (VALID_OPTIONS[key]?.includes(value)) updateAppearance({ [key]: value });
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

      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.accent = appearance.accent;
      document.documentElement.dataset.surface = appearance.surface;
      document.documentElement.dataset.corners = appearance.corners;
      document.documentElement.dataset.background = appearance.background;
      document.documentElement.dataset.animationStyle = appearance.animationStyle;
      document.documentElement.dataset.layout = appearance.layout;
      document.documentElement.dataset.motion = appearance.motion ? "on" : "off";
      document.documentElement.style.setProperty("--accent", accentColor);
      document.documentElement.style.setProperty("--glass-blur", `${appearance.blur * 0.32}px`);

      const background = theme === "light" ? "#f3f3f3" : "#101112";
      for (const method of ["setHeaderColor", "setBackgroundColor", "setBottomBarColor"]) {
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

  const value = useMemo(() => ({
    appearance,
    ready,
    setPreference,
    resetAppearance,
  }), [appearance, ready, setPreference, resetAppearance]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
