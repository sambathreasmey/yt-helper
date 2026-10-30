"use client";

import { useEffect, useState } from "react";
import { getTelegramClient, getTelegramProfile } from "@/services/telegram-client";
import { registerTelegramUser } from "@/services/telegram-user-api";

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
  }, []);

  useEffect(() => {
    const user = telegram?.initDataUnsafe?.user;
    if (!user?.id) return;

    registerTelegramUser({
      chatId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
      isPremium: user.is_premium,
      photoUrl: user.photo_url,
      platform: telegram?.platform,
      appVersion: telegram?.version,
    });
  }, [telegram]);

  return { telegram, profile };
}
