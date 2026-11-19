"use client";

import { Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { ShareImageSheet, type ShareImageJob } from "@/components/share-image-sheet";
import { formatUsd } from "@/features/gold-trading/gold-format";
import { formatUtcTimestamp } from "@/lib/date-format";
import { renderGoldShareCard, type GoldShareCardData } from "@/lib/gold-share-card";
import { useLanguage } from "@/providers/language-provider";

interface GoldShareButtonProps {
  price: number;
  yesterdayPrice: number | null;
  history: number[];
  updatedOn?: string;
}

/** Round share button for the price card. Opens a sheet with the generated image and share / copy / download actions. */
export function GoldShareButton({ price, yesterdayPrice, history, updatedOn }: GoldShareButtonProps) {
  const { t, locale } = useLanguage();
  const [job, setJob] = useState<ShareImageJob | null>(null);

  const open = useCallback(() => {
    let yesterday: GoldShareCardData["yesterday"] = null;
    if (yesterdayPrice !== null && Number.isFinite(yesterdayPrice) && yesterdayPrice > 0) {
      const diff = Math.round((price - yesterdayPrice) * 100) / 100;
      const trend = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
      const sign = diff > 0 ? "+" : diff < 0 ? "\u2212" : "";
      yesterday = {
        label: t("yesterdayPrice"),
        value: formatUsd(String(yesterdayPrice), locale),
        change: formatUsd(String(Math.abs(diff)), locale),
        percent: `${sign}${Math.abs((diff / yesterdayPrice) * 100).toFixed(2)}%`,
        trend,
      };
    }

    const data: GoldShareCardData = {
      brand: "Helper",
      subtitle: t("goldTrading"),
      label: t("goldPrice"),
      amount: formatUsd(String(price), locale),
      unit: `/ ${t("damlungUnit")}`,
      updated: updatedOn ? t("updated", { date: formatUtcTimestamp(updatedOn, locale) }) : "",
      footer: window.location.host,
      history: history.slice(-24),
      yesterday,
    };

    setJob({
      fileName: "helper-gold-price.png",
      shareTitle: data.brand,
      shareText: `${data.label}: ${data.amount} ${data.unit}`,
      alt: data.label,
      render: () => renderGoldShareCard(data),
    });
  }, [history, locale, price, t, updatedOn, yesterdayPrice]);

  return (
    <>
      <button aria-label={t("shareCardTitle")} className="gold-share-button" onClick={open} type="button">
        <Share2 aria-hidden="true" size={18} />
      </button>
      <ShareImageSheet job={job} onClose={() => setJob(null)} title={t("shareCardTitle")} />
    </>
  );
}
