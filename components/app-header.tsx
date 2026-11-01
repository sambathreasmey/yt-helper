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
  brandIcon,
  brandVariant = "youtube",
}: {
  profile?: TelegramProfile | null;
  title?: string;
  subtitle?: string;
  brandIcon?: LucideIcon;
  brandVariant?: "youtube" | "gold";
}) {
  const { appearance } = useTheme();
  const { t } = useLanguage();
  const AppIcon = brandIcon || appIconComponents[appearance.appIcon] || CirclePlay;
  const brandClass = brandVariant === "gold" ? "gold-brand-mark" : "youtube-brand-mark";

  return (
    <header className="youtube-header mb-5 flex min-h-14 items-center gap-3" data-layout-slot="header">
      <span className={`${brandClass} app-brand-icon grid size-14 shrink-0 place-items-center rounded-full border border-border bg-accent-soft text-accent shadow-glass`}>
        <AppIcon aria-hidden="true" size={28} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="youtube-header-title block text-lg font-bold tracking-tight">{title || t("youtubeTitle")}</span>
        <span className="youtube-header-subtitle mt-1 block text-xs leading-relaxed text-muted">{subtitle || t("youtubeSubtitle")}</span>
      </span>
      <TelegramUserBadge profile={profile} />
      <ThemePicker />
    </header>
  );
}
