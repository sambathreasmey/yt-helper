"use client";

import { useEffect, useState } from "react";
import { isInsideTelegram } from "@/services/telegram-client";

const BOT_LINK = process.env.NEXT_PUBLIC_TELEGRAM_BOT_LINK || "https://t.me/homerestassistantbot?startapp";

export function TelegramOnlyGate({ children }) {
  // null = still checking (Telegram's script may not have run yet)
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    setAllowed(isInsideTelegram());
  }, []);

  if (allowed === null) return null;

  if (!allowed) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-lg font-semibold">Open in Telegram</h1>
        <p className="text-sm text-muted">
          YouTube Helper is only available as a Telegram Mini App.
        </p>
        {BOT_LINK && (
          <a
            href={BOT_LINK}
            className="rounded-xl border border-border bg-accent-soft px-4 py-2 text-sm font-semibold text-accent"
          >
            Open in Telegram
          </a>
        )}
      </main>
    );
  }

  return children;
}
