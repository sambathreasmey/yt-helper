"use client";

import { useEffect, useState } from "react";
import { getTelegramClient, getTelegramProfile } from "@/services/telegram-client";

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
    setProfile(getTelegramProfile(client));
  }, []);

  return { telegram, profile };
}
