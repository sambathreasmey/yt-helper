"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isInsideTelegram, getTelegramClient } from "@/services/telegram-client";
import { useTelegramUserQuery } from "@/hooks/use-telegram-user";
import { useLanguage } from "@/providers/language-provider";
import { LandingPage } from "@/components/landing/landing-page";

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

function BlockedGate({ children }: { children: ReactNode }) {
  const [initData, setInitData] = useState<string | undefined>(undefined);

  useEffect(() => {
    setInitData(getTelegramClient()?.initData || undefined);
  }, []);

  // Render the app right away; the register-user request runs in the background and
  // only swaps in the blocked screen if the backend reports the account as blocked.
  const { data, error, isError } = useTelegramUserQuery(initData);

  if (initData === undefined) return null;

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

  // While checking, show the landing page: it is the server-rendered HTML (search engines, slow
  // connections) and renders instantly. Inside Telegram it is hidden before first paint by the
  // `data-tg` flag set in the theme boot script, so Telegram users never see it.
  if (allowed === null || !allowed) return <LandingPage />;

  return <BlockedGate>{children}</BlockedGate>;
}
