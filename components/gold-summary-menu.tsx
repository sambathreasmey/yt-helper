"use client";

import { Ellipsis, Share2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionMenuSheet, type MenuAction } from "@/components/action-menu-sheet";
import { ShareImageSheet, type ShareImageJob } from "@/components/share-image-sheet";
import { formatProfit, formatQuantity, formatShortDate, formatUsd } from "@/features/gold-trading/gold-format";
import { renderGoldSummaryCard, type GoldSummaryCardData, type Trend } from "@/lib/gold-summary-card";
import { useLanguage } from "@/providers/language-provider";
import type { GoldOverview } from "@/services/gold-trading-api";

function trendOf(value: number | null): Trend {
  if (value === null || Math.round(value * 100) === 0) return "flat";
  return value > 0 ? "up" : "down";
}

/** Time the menu sheet needs to slide away before the next sheet opens (matches BottomSheet). */
const SHEET_EXIT_MS = 280;

/**
 * "…" button for the portfolio summary card. It opens a menu of options; for now there is one,
 * "Share as image". To add an option, push another entry into `actions` below.
 */
export function GoldSummaryMenu({ summary }: { summary: GoldOverview["summary"] }) {
  const { t, locale } = useLanguage();
  const [job, setJob] = useState<ShareImageJob | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const buildShareJob = useCallback(() => {
    // Builds the card data; `mask` says which values to hide.
    const makeData = (mask: Record<string, boolean>): GoldSummaryCardData => {
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

      return {
        brand: "Helper",
        subtitle: t("portfolio"),
        date: formatShortDate(new Date().toISOString(), locale),
        footer: window.location.host,
        heroLabel: t("totalProfitLoss"),
        heroValue: profit(total),
        heroTrend: trendOf(total),
        heroPercent,
        tiles: [
          {
            label: t("goldHeld"),
            value: `${formatQuantity(Number(summary.quantity_hun) / 100, locale)} ${t("damlungUnit")}`,
            masked: mask.goldHeld,
          },
          { label: t("costBasis"), value: money(Number(summary.cost_basis)), masked: mask.costBasis },
          { label: t("currentValue"), value: money(value) },
        ],
        results: [
          // A hidden value is drawn as a fixed-size blur, so neither its digits nor its colour show.
          {
            label: t("realizedPL"),
            value: profit(realized),
            trend: trendOf(realized),
            icon: "realized",
            masked: mask.realized,
          },
          { label: t("unrealizedPL"), value: profit(unrealized), trend: trendOf(unrealized), icon: "unrealized" },
        ],
      };
    };

    const initial = makeData({});

    setJob({
      fileName: "helper-gold-portfolio.png",
      shareTitle: initial.brand,
      shareText: `${initial.heroLabel}: ${initial.heroValue}`,
      alt: initial.heroLabel,
      optionsTitle: t("shareMaskTitle"),
      storageKey: "helper-summary-mask",
      options: [
        { id: "goldHeld", label: t("goldHeld") },
        { id: "costBasis", label: t("costBasis") },
        { id: "realized", label: t("realizedPL") },
      ],
      render: (mask) => renderGoldSummaryCard(makeData(mask)),
    });
  }, [locale, summary, t]);

  const actions: MenuAction[] = [
    {
      id: "share-image",
      icon: <Share2 aria-hidden="true" size={18} />,
      label: t("menuShareImage"),
      description: t("menuShareImageHint"),
      onSelect: () => {
        setMenuOpen(false);
        // Let the menu slide away first so two sheets never overlap.
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(buildShareJob, SHEET_EXIT_MS);
      },
    },
  ];

  return (
    <>
      <button aria-label={t("moreOptions")} className="gold-more-button" onClick={() => setMenuOpen(true)} type="button">
        <Ellipsis aria-hidden="true" size={20} />
      </button>
      <ActionMenuSheet actions={actions} onClose={() => setMenuOpen(false)} open={menuOpen} title={t("moreOptions")} />
      <ShareImageSheet job={job} onClose={() => setJob(null)} title={t("shareSummaryTitle")} />
    </>
  );
}
