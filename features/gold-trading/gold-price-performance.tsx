"use client";

import { ChartNoAxesCombined } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/language-provider";
import type {
  GoldPricePerformance,
  GoldPricePerformancePeriod,
  GoldUnit,
} from "@/services/gold-trading-api";
import { pricePerUnit, unitLabelKey, units } from "@/features/gold-trading/gold-format";

const periods: Array<{
  key: GoldPricePerformancePeriod;
  label: "performanceToday" | "performanceYesterday" | "performance30Days"
    | "performance6Months" | "performance1Year" | "performance5Years";
}> = [
  { key: "today", label: "performanceToday" },
  { key: "yesterday", label: "performanceYesterday" },
  { key: "30_days", label: "performance30Days" },
  { key: "6_months", label: "performance6Months" },
  { key: "1_year", label: "performance1Year" },
  { key: "5_years", label: "performance5Years" },
];

function trendClass(value: number | null): string {
  if (value === null || value === 0) return "text-muted";
  return value < 0 ? "pl-down" : "pl-up";
}

function formatAmount(value: number, locale: string, fractionDigits: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const amount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(value));
  return `${sign}${amount}`;
}

export function GoldPricePerformanceSummary({
  performance,
}: {
  performance: GoldPricePerformance;
}) {
  const { t, locale } = useLanguage();
  const [unit, setUnit] = useState<GoldUnit>("damlung");
  const fractionDigits = unit === "damlung" ? 2 : unit === "chi" ? 3 : 4;

  return (
    <Card
      aria-label={t("goldPricePerformance")}
      className="gold-performance-card"
      role="region"
    >
      <div className="gold-performance-heading">
        <ChartNoAxesCombined aria-hidden="true" size={18} />
        <h2>{t("goldPricePerformance")}</h2>
      </div>
      <div className="gold-performance-controls">
        <span>{t("performanceUnit")}</span>
        <div aria-label={t("performanceUnit")} className="gold-performance-units" role="group">
          {units.map((option) => (
            <button
              aria-pressed={unit === option}
              key={option}
              onClick={() => setUnit(option)}
              type="button"
            >
              {t(unitLabelKey(option))}
            </button>
          ))}
        </div>
      </div>
      <table className="gold-performance-table">
        <thead>
          <tr>
            <th scope="col">{t("performanceChange")}</th>
            <th scope="col">{t("performanceAmount")}</th>
            <th scope="col">{t("performancePercent")}</th>
          </tr>
        </thead>
        <tbody>
          {periods.map(({ key, label }) => {
            const change = performance[key];
            const amount = change.amount === null ? null : Number(change.amount);
            const percentage = change.percentage === null
              ? null
              : Number(change.percentage);
            const validAmount = amount !== null && Number.isFinite(amount) ? amount : null;
            const validPercentage = percentage !== null && Number.isFinite(percentage)
              ? percentage
              : null;
            const amountForUnit = validAmount === null
              ? null
              : Number(pricePerUnit(String(validAmount), unit));

            return (
              <tr key={key}>
                <th scope="row">{t(label)}</th>
                <td className={cn(trendClass(amountForUnit))}>
                  {amountForUnit === null
                    ? "—"
                    : formatAmount(amountForUnit, locale, fractionDigits)}
                </td>
                <td className={cn(trendClass(validPercentage))}>
                  {validPercentage === null
                    ? "—"
                    : `${validPercentage > 0 ? "+" : validPercentage < 0 ? "−" : ""}${
                      new Intl.NumberFormat(locale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(Math.abs(validPercentage))
                    }%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
