"use client";

import { Share2 } from "lucide-react";
import { useCallback, useState } from "react";
import { ShareImageSheet, type ShareImageJob } from "@/components/share-image-sheet";
import { formatProfit, formatQuantity, formatShortDate, formatUsd } from "@/features/gold-trading/gold-format";
import { renderGoldSummaryCard, type GoldSummaryCardData, type Trend } from "@/lib/gold-summary-card";
import { useLanguage } from "@/providers/language-provider";
import type { GoldOverview } from "@/services/gold-trading-api";

function trendOf(value: number | null): Trend {
  if (value === null || Math.round(value * 100) === 0) return "flat";
  return value > 0 ? "up" : "down";
}

/** Share button for the portfolio summary card: makes a designed image to share, copy or download. */
export function GoldSummaryShareButton({ summary }: { summary: GoldOverview["summary"] }) {
  const { t, locale } = useLanguage();
  const [job, setJob] = useState<ShareImageJob | null>(null);

  const open = useCallback(() => {
    const total = summary.total_profit_loss === null ? null : Number(summary.total_profit_loss);
    const unrealized = summary.unrealized_profit_loss === null ? null : Number(summary.unrealized_profit_loss);
    const realized = Number(summary.realized_profit_loss);
    const value = summary.market_value === null ? null : Number(summary.market_value);
    const invested = Number(summary.total_purchase_cost);
    const money = (amount: number | null) => (amount === null ? "\u2014" : formatUsd(String(amount), locale));
    const profit = (amount: number | null) => (amount === null ? "\u2014" : formatProfit(String(amount), locale));

    let heroPercent: string | null = null;
    if (total !== null && Number.isFinite(invested) && invested > 0) {
      const percent = (total / invested) * 100;
      heroPercent = `${percent > 0 ? "+" : percent < 0 ? "\u2212" : ""}${Math.abs(percent).toFixed(2)}%`;
    }

    const data: GoldSummaryCardData = {
      brand: "Helper",
      subtitle: t("portfolio"),
      date: formatShortDate(new Date().toISOString(), locale),
      footer: window.location.host,
      heroLabel: t("totalProfitLoss"),
      heroValue: profit(total),
      heroTrend: trendOf(total),
      heroPercent,
      tiles: [
        { label: t("goldHeld"), value: `${formatQuantity(Number(summary.quantity_hun) / 100, locale)} ${t("damlungUnit")}` },
        { label: t("costBasis"), value: money(Number(summary.cost_basis)) },
        { label: t("currentValue"), value: money(value) },
      ],
      results: [
        { label: t("realizedPL"), value: profit(realized), trend: trendOf(realized), icon: "realized" },
        { label: t("unrealizedPL"), value: profit(unrealized), trend: trendOf(unrealized), icon: "unrealized" },
      ],
    };

    setJob({
      fileName: "helper-gold-portfolio.png",
      shareTitle: data.brand,
      shareText: `${data.heroLabel}: ${data.heroValue}`,
      alt: data.heroLabel,
      render: () => renderGoldSummaryCard(data),
    });
  }, [locale, summary, t]);

  return (
    <>
      <button aria-label={t("shareSummaryTitle")} className="gold-share-button" onClick={open} type="button">
        <Share2 aria-hidden="true" size={17} />
      </button>
      <ShareImageSheet job={job} onClose={() => setJob(null)} title={t("shareSummaryTitle")} />
    </>
  );
}
