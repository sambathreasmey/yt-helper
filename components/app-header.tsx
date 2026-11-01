"use client";

import { CirclePlay, Clapperboard, Film, Headphones, Play, type LucideIcon } from "lucide-react";
import { TelegramUserBadge } from "@/components/telegram-user-badge";
import { ThemePicker } from "@/components/theme-picker";
import { useTheme } from "@/providers/theme-provider";
import { useLanguage } from "@/providers/language-provider";
import type { TelegramProfile } from "@/services/telegram-client";

const appIconComponents: Record<string, LucideIcon> = {
  "circle-play": CirclePlay,
  play: Play,
  film: Film,
  clapperboard: Clapperboard,
  headphones: Headphones,
};

export function AppHeader({
  profile = null,
  title,
  subtitle,
}: {
  profile?: TelegramProfile | null;
  title?: string;
  subtitle?: string;
}) {
  const { appearance } = useTheme();
  const { t } = useLanguage();
  const AppIcon = appIconComponents[appearance.appIcon] || CirclePlay;

  return (
    <header className="mb-5 flex min-h-14 items-center gap-3" data-layout-slot="header">
      <span className="app-brand-icon grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-accent-soft text-accent shadow-glass">
        <AppIcon aria-hidden="true" size={23} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold tracking-tight">{title || t("youtubeTitle")}</span>
        <span className="mt-0.5 block text-xs text-muted">{subtitle || t("youtubeSubtitle")}</span>
      </span>
      <TelegramUserBadge profile={profile} />
      <ThemePicker />
    </header>
  );
}
