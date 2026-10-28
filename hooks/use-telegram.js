"use client";

import { useEffect, useState } from "react";
import { applyTelegramTheme, getTelegramClient, getTelegramProfile } from "@/services/telegram-client";

export function useTelegram() {
  const [telegram, setTelegram] = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const client = getTelegramClient();
    setTelegram(client);
    try {
      client?.ready?.();
      client?.expand?.();
      client?.requestFullscreen?.();
      client?.disableVerticalSwipes?.();
    } catch {
      // Telegram versions may support only a subset of these controls.
    }

    setProfile(getTelegramProfile(client));

    const syncTheme = () => {
      const theme = client?.colorScheme ||
        (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      document.documentElement.dataset.theme = theme;
      applyTelegramTheme(client, theme);
    };
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    syncTheme();
    client?.onEvent?.("themeChanged", syncTheme);
    mediaQuery.addEventListener?.("change", syncTheme);

    return () => {
      client?.offEvent?.("themeChanged", syncTheme);
      mediaQuery.removeEventListener?.("change", syncTheme);
    };
  }, []);

  return { telegram, profile };
}
