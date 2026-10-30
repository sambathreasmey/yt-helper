"use client";

import { Clapperboard, CirclePlay, Film, Headphones, Play } from "lucide-react";
import { TelegramUserBadge } from "@/components/telegram-user-badge";
import { ThemePicker } from "@/components/theme-picker";
import { useTheme } from "@/providers/theme-provider";

const appIconComponents = {
  "circle-play": CirclePlay,
  play: Play,
  film: Film,
  clapperboard: Clapperboard,
  headphones: Headphones,
};

export function AppHeader({ profile = null }) {
  const { appearance } = useTheme();
  const AppIcon = appIconComponents[appearance.appIcon] || CirclePlay;

  return (
    <header className="mb-5 flex min-h-14 items-center gap-3" data-layout-slot="header">
      <span className="app-brand-icon grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-accent-soft text-accent shadow-glass">
        <AppIcon aria-hidden="true" size={23} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold tracking-tight">YouTube Helper</span>
        <span className="mt-0.5 block text-xs text-muted">Your videos, one tap away</span>
      </span>
      <TelegramUserBadge profile={profile} />
      <ThemePicker />
    </header>
  );
}
