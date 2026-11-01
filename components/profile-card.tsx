"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TelegramProfile } from "@/services/telegram-client";
import { useLanguage } from "@/providers/language-provider";

export function ProfileCard({ profile }: { profile: TelegramProfile | null }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { t } = useLanguage();

  return (
    <Card className="youtube-profile-card mb-3 flex min-h-[94px] items-center gap-3 p-3.5" data-layout-slot="profile">
      <span className="youtube-profile-avatar relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-strong text-muted">
        {profile?.photoUrl && !imageFailed ? (
          <img
            src={profile.photoUrl}
            alt=""
            className="size-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : profile ? (
          <span className="text-sm font-semibold text-foreground">
            {profile.name[0]?.toUpperCase() || <UserRound size={18} />}
          </span>
        ) : (
          <UserRound aria-hidden="true" size={18} />
        )}
        {profile && <span aria-hidden="true" className="youtube-profile-online" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">
          {profile ? t("telegramProfile") : t("localProfile")}
        </span>
        <span className="block truncate text-sm font-bold">
          {profile?.name || t("yourLibrary")}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {profile?.handle || t("savedOnDevice")}
        </span>
      </span>
      <span className="size-1.5 shrink-0 rounded-full bg-muted/70" aria-hidden="true" />
    </Card>
  );
}
