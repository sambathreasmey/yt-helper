"use client";

import { ArrowUpFromLine, ChartNoAxesCombined } from "lucide-react";
import { memo, useCallback } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/language-provider";
import type { GoldOverview } from "@/services/gold-trading-api";
import { formatProfit, formatQuantity, formatUsd } from "@/features/gold-trading/gold-format";

interface GoldSummaryProps {
  summary: GoldOverview["summary"];
  animate: boolean;
}

function plClass(value: number | null): string {
  if (value === null) return "text-muted";
  return value < 0 ? "pl-down" : "pl-up";
}

/** The whole portfolio at a glance in one compact card, so nothing needs scrolling to find it. */
export const GoldSummary = memo(function GoldSummary({ summary, animate }: GoldSummaryProps) {
  const { t, locale } = useLanguage();
  const formatMoney = useCallback((value: number) => formatUsd(String(value), locale), [locale]);
  const formatPL = useCallback((value: number) => formatProfit(String(value), locale), [locale]);
  const formatHeld = useCallback(
    (value: number) => `${formatQuantity(value, locale)} ${t("damlungUnit")}`,
    [locale, t],
  );
  const total = summary.total_profit_loss === null ? null : Number(summary.total_profit_loss);
  const unrealized = summary.unrealized_profit_loss === null ? null : Number(summary.unrealized_profit_loss);
  const realized = Number(summary.realized_profit_loss);
  const value = summary.market_value === null ? null : Number(summary.market_value);

  return (
    <Card aria-label={t("portfolio")} className="gold-summary" role="region">
      <div className="gold-summary-top">
        <span aria-hidden="true" className="gold-summary-icon"><ChartNoAxesCombined size={22} strokeWidth={2.2} /></span>
        <div className="min-w-0 flex-1">
          <p className="gold-summary-label">{t("totalProfitLoss")}</p>
          <p className={cn("gold-summary-total", plClass(total))}>
            {total === null
              ? "—"
              : <AnimatedNumber animate={animate} format={formatPL} value={total} />}
          </p>
        </div>
      </div>

      <dl className="gold-summary-stats">
        <div>
          <dt>{t("goldHeld")}</dt>
          <dd><AnimatedNumber animate={animate} format={formatHeld} value={Number(summary.quantity_hun) / 100} /></dd>
        </div>
        <div>
          <dt>{t("costBasis")}</dt>
          <dd><AnimatedNumber animate={animate} format={formatMoney} value={Number(summary.cost_basis)} /></dd>
        </div>
        <div>
          <dt>{t("currentValue")}</dt>
          <dd>{value === null ? "—" : <AnimatedNumber animate={animate} format={formatMoney} value={value} />}</dd>
        </div>
      </dl>

      <div className="gold-summary-chips">
        <span className="gold-chip">
          <ArrowUpFromLine aria-hidden="true" size={13} />
          <span className="gold-chip-label">{t("realizedPL")}</span>
          <b className={plClass(realized)}><AnimatedNumber animate={animate} format={formatPL} value={realized} /></b>
        </span>
        <span className="gold-chip">
          <ChartNoAxesCombined aria-hidden="true" size={13} />
          <span className="gold-chip-label">{t("unrealizedPL")}</span>
          <b className={plClass(unrealized)}>
            {unrealized === null ? "—" : <AnimatedNumber animate={animate} format={formatPL} value={unrealized} />}
          </b>
        </span>
      </div>
    </Card>
  );
});
