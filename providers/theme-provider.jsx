"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "yt-helper-theme";
const ThemeContext = createContext(null);

function readSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "system";
  } catch {
    return "system";
  }
}

function resolveTheme(theme, telegram, prefersLight) {
  if (theme === "light" || theme === "dark") return theme;
  return telegram?.colorScheme === "light" || (!telegram?.colorScheme && prefersLight)
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");

  useEffect(() => {
    setThemeState(readSavedTheme());
  }, []);

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme !== "system" && nextTheme !== "light" && nextTheme !== "dark") return;
    setThemeState(nextTheme);
    try {
      if (nextTheme === "system") window.localStorage.removeItem(STORAGE_KEY);
      else window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // The selected theme remains active for the current page if storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => {
      const resolvedTheme = resolveTheme(theme, telegram, mediaQuery.matches);
      document.documentElement.dataset.theme = resolvedTheme;

      const background = resolvedTheme === "light" ? "#f3f3f3" : "#101112";
      for (const method of ["setHeaderColor", "setBackgroundColor", "setBottomBarColor"]) {
        try {
          telegram?.[method]?.(background);
        } catch {
          // Not all Telegram clients expose every color method.
        }
      }
    };

    applyTheme();
    mediaQuery.addEventListener?.("change", applyTheme);
    telegram?.onEvent?.("themeChanged", applyTheme);

    return () => {
      mediaQuery.removeEventListener?.("change", applyTheme);
      telegram?.offEvent?.("themeChanged", applyTheme);
    };
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}
