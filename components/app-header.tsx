"use client";

import { memo, useState, type ReactNode } from "react";
import { CirclePlay, Clapperboard, Film, Headphones, Play, type LucideIcon } from "lucide-react";
import { ThemePicker } from "@/components/theme-picker";
import { useTheme } from "@/providers/theme-provider";
import { useLanguage } from "@/providers/language-provider";

const appIconComponents: Record<string, LucideIcon> = {
  "circle-play": CirclePlay,
  play: Play,
  film: Film,
  clapperboard: Clapperboard,
  headphones: Headphones,
};

export interface HeaderAvatar {
  /** Profile photo URL; the fallback letter (or the brand icon) shows when missing or broken. */
  photoUrl: string | null;
  fallback: string;
  /** Accessible name for the tappable avatar. */
  label: string;
  onClick: () => void;
  /** Small round badge on the corner of the avatar (for example the gold icon). */
  badge?: ReactNode;
}

function AppHeaderImpl({
  title,
  subtitle,
  brandIcon,
  brandVariant = "youtube",
  avatar,
}: {
  title?: string;
  subtitle?: string;
  brandIcon?: LucideIcon;
  brandVariant?: "youtube" | "gold";
  avatar?: HeaderAvatar;
}) {
  const { appearance } = useTheme();
  const { t } = useLanguage();
  const [photoFailed, setPhotoFailed] = useState(false);
  const AppIcon = brandIcon || appIconComponents[appearance.appIcon] || CirclePlay;
  const brandClass = brandVariant === "gold" ? "gold-brand-mark" : "youtube-brand-mark";

  return (
    <header className="youtube-header mb-5 flex min-h-14 items-center gap-3" data-layout-slot="header">
      {avatar ? (
        <button
          aria-label={avatar.label}
          className={`${brandClass} app-brand-icon app-brand-avatar grid size-14 shrink-0 place-items-center rounded-full border border-border bg-accent-soft text-accent shadow-glass`}
          onClick={avatar.onClick}
          type="button"
        >
          <span className="app-brand-photo">
            {avatar.photoUrl && !photoFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" decoding="async" onError={() => setPhotoFailed(true)} referrerPolicy="no-referrer" src={avatar.photoUrl} />
            ) : avatar.fallback ? (
              <span className="app-brand-initial">{avatar.fallback}</span>
            ) : (
              <AppIcon aria-hidden="true" size={28} strokeWidth={1.8} />
            )}
          </span>
          {avatar.badge && <span aria-hidden="true" className="app-brand-badge">{avatar.badge}</span>}
        </button>
      ) : (
        <span className={`${brandClass} app-brand-icon grid size-14 shrink-0 place-items-center rounded-full border border-border bg-accent-soft text-accent shadow-glass`}>
          <AppIcon aria-hidden="true" size={28} strokeWidth={1.8} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="youtube-header-title block text-lg font-bold tracking-tight">{title || t("youtubeTitle")}</span>
        <span className="youtube-header-subtitle mt-1 block text-xs leading-relaxed text-muted">{subtitle || t("youtubeSubtitle")}</span>
      </span>
      <ThemePicker />
    </header>
  );
}

export const AppHeader = memo(AppHeaderImpl);
