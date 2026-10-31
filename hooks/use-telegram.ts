"use client";

import { useEffect, useState } from "react";
import { getTelegramClient, getTelegramProfile, type TelegramProfile } from "@/services/telegram-client";
import type { TelegramWebApp } from "@/types/telegram";

export function useTelegram(): {
  telegram: TelegramWebApp | null | undefined;
  profile: TelegramProfile | null;
} {
  const [telegram, setTelegram] = useState<TelegramWebApp | null | undefined>(undefined);
  const [profile, setProfile] = useState<TelegramProfile | null>(null);

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
  }, []);

  return { telegram, profile };
}
