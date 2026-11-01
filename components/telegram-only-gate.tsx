"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isInsideTelegram, getTelegramClient } from "@/services/telegram-client";
import { useTelegramUserQuery } from "@/hooks/use-telegram-user";
import { useLanguage } from "@/providers/language-provider";

const BOT_LINK = process.env.NEXT_PUBLIC_TELEGRAM_BOT_LINK || "https://t.me/homerestassistantbot?startapp";

function BlockedScreen() {
  const { t } = useLanguage();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold">{t("accountBlocked")}</h1>
      <p className="text-sm text-muted">
        {t("blockedDescription")}
      </p>
    </main>
  );
}

function TelegramOnlyScreen() {
  const { t } = useLanguage();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-lg font-semibold">Open in Telegram</h1>
      <p className="text-sm text-muted">
        {t("telegramOnly")}
      </p>
      {BOT_LINK && (
        <a
          href={BOT_LINK}
          className="rounded-xl border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-accent"
        >
          {t("openInTelegram")}
        </a>
      )}
    </main>
  );
}

function BlockedGate({ children }: { children: ReactNode }) {
  const [initData, setInitData] = useState<string | undefined>(undefined);

  useEffect(() => {
    setInitData(getTelegramClient()?.initData || undefined);
  }, []);

  const { data, error, isPending, isError } = useTelegramUserQuery(initData);

  if (initData === undefined || (initData && isPending)) return null;

  if (isError && error?.name === "BlockedUserError") return <BlockedScreen />;
  if (data?.user?.status === "BLOCKED") return <BlockedScreen />;

  return <>{children}</>;
}

export function TelegramOnlyGate({ children }: { children: ReactNode }) {
  // null = still checking (Telegram's script may not have run yet)
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setAllowed(isInsideTelegram());
  }, []);

  if (allowed === null) return null;

  if (!allowed) return <TelegramOnlyScreen />;

  return <BlockedGate>{children}</BlockedGate>;
}
