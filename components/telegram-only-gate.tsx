"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, BellRing, CirclePlay, Coins, Heart, Send, Sparkles } from "lucide-react";
import { isInsideTelegram, getTelegramClient } from "@/services/telegram-client";
import { useTelegramUserQuery } from "@/hooks/use-telegram-user";
import { useLanguage } from "@/providers/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

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
    <main className="welcome-page mx-auto w-full max-w-5xl py-3 sm:py-8">
      <header className="welcome-header mb-5 flex items-center justify-between gap-3 sm:mb-7">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            alt="Helper Mini App"
            className="size-12 rounded-2xl border border-white/15 object-cover shadow-lg sm:size-14"
            height={512}
            priority
            src="/logo.png"
            width={512}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight sm:text-base">Helper Mini App</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-muted sm:text-xs">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
              {t("welcomeEyebrow")}
            </p>
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      <section aria-label={t("welcomeTitle")} className="welcome-banner relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface shadow-glass sm:rounded-[2rem]">
        <div className="relative aspect-[1.9/1] w-full">
          <Image
            alt=""
            className="welcome-banner-image object-cover"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            src="/banner.png"
          />
          <div aria-hidden="true" className="welcome-banner-shade absolute inset-0 bg-gradient-to-t from-[#07142c]/40 via-transparent to-transparent" />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-semibold text-white/90 shadow-lg backdrop-blur-md sm:bottom-5 sm:right-5 sm:text-xs">
            <Sparkles aria-hidden="true" size={13} />
            {t("welcomeEyebrow")}
          </span>
        </div>
      </section>

      <section className="welcome-intro mx-auto max-w-3xl px-1 pb-5 pt-7 text-center sm:pb-7 sm:pt-9">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-accent sm:text-xs">
          {t("featurePreview")}
        </p>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {t("welcomeTitle")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
          {t("welcomeDescription")}
        </p>
        {BOT_LINK && (
          <div className="welcome-cta-wrap mx-auto mt-5 max-w-sm">
            <a
              className="welcome-cta group relative flex min-h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#229ED9] px-5 text-base font-bold text-white shadow-[0_12px_30px_rgb(34_158_217/32%)] transition hover:-translate-y-0.5 hover:bg-[#168dcc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#229ED9] active:translate-y-0 sm:min-h-16 sm:text-lg"
              href={BOT_LINK}
              rel="noreferrer"
              target="_blank"
            >
              <Send aria-hidden="true" className="shrink-0" fill="currentColor" size={20} />
              <span>{t("openInTelegram")}</span>
              <ArrowRight aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-1" size={19} />
            </a>
            <p className="mt-2 text-xs text-muted">{t("openTelegramHint")}</p>
          </div>
        )}
      </section>

      <section aria-label={t("featurePreview")} className="welcome-features grid gap-3 sm:grid-cols-2 sm:gap-4">
        <article className="welcome-feature-card glass flex min-h-36 items-start gap-4 rounded-3xl p-4 sm:p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300 shadow-inner sm:size-14">
            <CirclePlay aria-hidden="true" size={27} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight sm:text-lg">{t("youtubeTitle")}</h2>
            <p className="mt-1 text-xs font-medium text-accent">{t("youtubeSubtitle")}</p>
            <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">{t("youtubeDemoDescription")}</p>
            <div aria-hidden="true" className="mt-3 flex gap-2 text-[10px] font-semibold text-foreground/80">
              <span className="rounded-full border border-border bg-surface px-2.5 py-1">{t("shorts")}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1">
                <Heart aria-hidden="true" size={11} /> {t("favorites")}
              </span>
            </div>
          </div>
        </article>

        <article className="welcome-feature-card glass flex min-h-36 items-start gap-4 rounded-3xl p-4 sm:p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-300 shadow-inner sm:size-14">
            <Coins aria-hidden="true" size={27} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight sm:text-lg">{t("goldTrading")}</h2>
            <p className="mt-1 text-xs font-medium text-accent">{t("goldSubtitle")}</p>
            <p className="mt-2 text-xs leading-5 text-muted sm:text-sm">{t("goldDemoDescription")}</p>
            <div aria-hidden="true" className="mt-3 flex gap-2 text-[10px] font-semibold text-foreground/80">
              <span className="rounded-full border border-border bg-surface px-2.5 py-1">{t("report")}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1">
                <BellRing aria-hidden="true" size={11} /> {t("priceAlerts")}
              </span>
            </div>
          </div>
        </article>
      </section>

      <footer className="mx-auto mt-5 flex max-w-xl justify-center text-center sm:mt-7">
        <p className="text-xs leading-5 text-muted">{t("telegramOnly")}</p>
      </footer>
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
