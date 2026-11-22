"use client";

import { ArrowLeft, ChevronRight, ExternalLink, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/providers/language-provider";
import type { GoldNewsResponse } from "@/services/gold-trading-api";

function formatSeenAt(value: string | null, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Phnom_Penh",
  }).format(date);
}

export function GoldNewsBar({
  data,
  error,
  isPending,
  onOpen,
}: {
  data: GoldNewsResponse | undefined;
  error: Error | null;
  isPending: boolean;
  onOpen: () => void;
}) {
  const { t } = useLanguage();
  const latest = data?.items[0];
  const headline = latest?.title
    ?? (isPending ? t("goldNewsLoading") : error ? t("goldNewsError") : t("goldNewsEmpty"));

  return (
    <button
      aria-label={`${t("goldNewsLatest")}: ${headline}. ${t("goldNewsViewAll")}`}
      className="gold-news-ticker"
      onClick={onOpen}
      type="button"
    >
      <Newspaper aria-hidden="true" className="gold-news-ticker-icon" size={18} />
      <span className="gold-news-ticker-copy">
        <span className="gold-news-ticker-label">{t("goldNewsLatest")}</span>
        <span className="gold-news-ticker-headline">{headline}</span>
      </span>
      <span className="gold-news-ticker-action">
        <span className="gold-news-ticker-action-label">{t("goldNewsViewAll")}</span>
        <ChevronRight aria-hidden="true" size={16} />
      </span>
    </button>
  );
}

export function GoldNewsScreen({
  data,
  isPending,
  isFetching,
  error,
  onRetry,
  onBack,
}: {
  data: GoldNewsResponse | undefined;
  isPending: boolean;
  isFetching: boolean;
  error: Error | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { t, locale } = useLanguage();

  return (
    <section className="gold-news-screen">
      <Button
        className="gold-news-back"
        onClick={onBack}
        type="button"
        variant="ghost"
      >
        <ArrowLeft aria-hidden="true" size={18} />
        {t("goldNewsBack")}
      </Button>

      <Card
        aria-label={t("goldNewsTitle")}
        className="gold-news-card"
        role="region"
      >
        <div className="gold-news-heading">
          <Newspaper aria-hidden="true" size={18} />
          <h1>{t("goldNewsTitle")}</h1>
        </div>
        <p className="gold-news-disclaimer">{t("goldNewsDisclaimer")}</p>

        {data?.stale && (
          <p className="gold-news-stale" role="status">{t("goldNewsStale")}</p>
        )}

        {isPending && (
          <p className="gold-news-state" role="status">{t("goldNewsLoading")}</p>
        )}

        {error && !data && (
          <div className="gold-news-error" role="alert">
            <p>{t("goldNewsError")}</p>
            <Button
              disabled={isFetching}
              onClick={onRetry}
              size="sm"
              type="button"
              variant="secondary"
            >
              {t("goldNewsRetry")}
            </Button>
          </div>
        )}

        {!isPending && data?.items.length === 0 && (
          <p className="gold-news-state">{t("goldNewsEmpty")}</p>
        )}

        {data && data.items.length > 0 && (
          <ul className="gold-news-list">
            {data.items.map((item) => {
              const seenAt = formatSeenAt(item.seen_at, locale);
              return (
                <li className="gold-news-item" key={item.id}>
                  <a
                    className="gold-news-link"
                    href={item.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span>{item.title}</span>
                    <ExternalLink aria-hidden="true" size={14} />
                  </a>
                  <div className="gold-news-meta">
                    <span>{item.domain}</span>
                    {item.language !== "unknown" && (
                      <span>{t("goldNewsHeadlineLanguage", { language: item.language })}</span>
                    )}
                    {seenAt && (
                      <time dateTime={item.seen_at ?? undefined}>
                        {t("goldNewsSeenAt", { date: seenAt })}
                      </time>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <a
          className="gold-news-attribution"
          href={data?.attribution.url ?? "https://www.gdeltproject.org/"}
          rel="noopener noreferrer"
          target="_blank"
        >
          {t("goldNewsAttribution", {
            provider: data?.attribution.provider ?? "GDELT Project",
          })}
        </a>
      </Card>
    </section>
  );
}
