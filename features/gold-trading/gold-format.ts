import type { TranslationKey } from "@/providers/language-provider";
import type { GoldUnit } from "@/services/gold-trading-api";

export const units: GoldUnit[] = ["damlung", "chi", "hun"];

const hunPerDamlung: Record<GoldUnit, number> = {
  damlung: 100,
  chi: 10,
  hun: 1,
};

export function pricePerUnit(pricePerDamlung: string, unit: GoldUnit): string {
  return (Number(pricePerDamlung) * hunPerDamlung[unit] / hunPerDamlung.damlung).toFixed(6);
}

export function unitLabelKey(unit: GoldUnit): TranslationKey {
  return unit === "damlung" ? "damlungUnit" : unit === "chi" ? "chiUnit" : "hunUnit";
}

export function formatUsd(value: string | null | undefined, locale: string): string {
  if (value === null || value === undefined) return "—";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(amount)
    : "—";
}

export function formatQuantity(value: string | number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(Number(value));
}

export function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(locale);
}

export function formatShortDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export function formatProfit(value: string | null, locale: string): string {
  if (value === null) return "—";
  const formatted = formatUsd(value, locale);
  return Number(value) > 0 ? `+${formatted}` : formatted;
}

/** Theme-aware profit/loss colour classes (defined in globals.css for both light and dark). */
export function profitClass(value: string | null): string {
  if (value === null) return "text-muted";
  return Number(value) < 0 ? "pl-down" : "pl-up";
}
