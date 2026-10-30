"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";

export function TelegramUserBadge({ profile }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!profile) return null;

  const initial = profile.name?.[0]?.toUpperCase();

  return (
    <span
      className="flex min-w-0 max-w-[150px] shrink items-center gap-2 rounded-full border border-border bg-surface-strong py-1 pl-1 pr-3"
      data-telegram-user
      title={profile.handle || profile.name}
    >
      <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft text-accent">
        {profile.photoUrl && !imageFailed ? (
          <img
            src={profile.photoUrl}
            alt=""
            className="size-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : initial ? (
          <span className="text-xs font-semibold">{initial}</span>
        ) : (
          <UserRound aria-hidden="true" size={14} />
        )}
      </span>
      <span className="min-w-0 truncate text-xs font-semibold">
        {profile.name || profile.handle}
      </span>
    </span>
  );
}
