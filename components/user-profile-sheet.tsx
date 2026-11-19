"use client";

import { Crown, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { useTelegram } from "@/hooks/use-telegram";
import { useTelegramUserQuery } from "@/hooks/use-telegram-user";
import { formatUtcTimestamp } from "@/lib/date-format";
import { useLanguage } from "@/providers/language-provider";

interface SubscriptionInfo {
  plan_type?: string | null;
  subscription_ends_on?: string | null;
  trial_ends_on?: string | null;
}

function humanize(value: string): string {
  const text = value.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-semibold">{value}</dd>
    </div>
  );
}

function UserProfileContent() {
  const { t, locale } = useLanguage();
  const { telegram, profile } = useTelegram();
  const [photoFailed, setPhotoFailed] = useState(false);
  const tgUser = telegram?.initDataUnsafe?.user;
  const query = useTelegramUserQuery(telegram?.initData || undefined);
  const record = query.data?.user;
  const subscription = (query.data?.subscription && typeof query.data.subscription === "object"
    ? query.data.subscription
    : {}) as SubscriptionInfo;

  const name = profile?.name || record?.full_name || "";
  const username = tgUser?.username || record?.username || null;
  const photoUrl = profile?.photoUrl || record?.photo_url || null;
  const telegramId = tgUser?.id ?? record?.chat_id ?? null;
  const language = tgUser?.language_code || record?.language_code || null;
  const isTelegramPremium = Boolean(tgUser?.is_premium ?? record?.is_premium);
  const planLabel = subscription.plan_type ? humanize(subscription.plan_type) : t("profileFreePlan");
  const date = (value?: string | null) => (value ? formatUtcTimestamp(value, locale) : null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-strong text-2xl font-bold text-foreground">
          {photoUrl && !photoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="size-full object-cover"
              decoding="async"
              onError={() => setPhotoFailed(true)}
              referrerPolicy="no-referrer"
              src={photoUrl}
            />
          ) : name ? (
            name.charAt(0).toUpperCase()
          ) : (
            <UserRound aria-hidden="true" size={30} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{name || "—"}</p>
          <p className="truncate text-sm text-muted">{username ? `@${username}` : t("profileNoUsername")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full border border-border bg-surface-strong px-2.5 py-0.5 text-xs font-semibold">{planLabel}</span>
            {isTelegramPremium && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-strong px-2.5 py-0.5 text-xs font-semibold">
                <Crown aria-hidden="true" size={12} /> {t("profileTelegramPremium")}
              </span>
            )}
          </div>
        </div>
      </div>

      <dl className="divide-y divide-border">
        <Row label={t("profileTelegramId")} value={telegramId} />
        <Row label={t("profileLanguage")} value={language ? language.toUpperCase() : null} />
        <Row label={t("profilePlan")} value={planLabel} />
        <Row label={t("profilePlanEnds")} value={date(subscription.subscription_ends_on)} />
        <Row label={t("profileTrialEnds")} value={date(subscription.trial_ends_on)} />
        <Row label={t("profileMemberSince")} value={date(record?.created_on)} />
        <Row label={t("profileLastActive")} value={date(record?.last_active_on)} />
      </dl>
    </div>
  );
}

/** Bottom sheet with the signed-in Telegram user's own information. */
export function UserProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <BottomSheet icon={<UserRound aria-hidden="true" size={18} />} onClose={onClose} open={open} title={t("myProfile")}>
      <UserProfileContent />
    </BottomSheet>
  );
}
