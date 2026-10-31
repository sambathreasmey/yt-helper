"use client";

import { useQuery } from "@tanstack/react-query";
import { registerTelegramUser, type TelegramUserData } from "@/services/telegram-user-api";

export const TELEGRAM_USER_QUERY_KEY = ["telegram-user"] as const;

/**
 * Registers the Telegram user through the backend with React Query.
 * The query fails with BlockedUserError when the backend returns 403.
 */
export function useTelegramUserQuery(initData: string | undefined, profile: { platform?: string; appVersion?: string } = {}) {
  return useQuery<TelegramUserData | null, Error>({
    queryKey: [...TELEGRAM_USER_QUERY_KEY, initData],
    queryFn: () => registerTelegramUser(initData as string, profile),
    enabled: Boolean(initData),
    retry: (failureCount, error) => error.name !== "BlockedUserError" && failureCount < 2,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
