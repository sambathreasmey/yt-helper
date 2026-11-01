"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  ChartNoAxesCombined,
  Coins,
  FileText,
  Pencil,
  Scale,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTelegram } from "@/hooks/use-telegram";
import { formatUtcTimestamp } from "@/lib/date-format";
import { useLanguage } from "@/providers/language-provider";
import {
  createGoldPriceAlert,
  createGoldPurchase,
  deleteGoldPriceAlert,
  deleteGoldPurchase,
  getGoldAlerts,
  getGoldOverview,
  sellGoldPurchase,
  updateGoldPurchase,
  type GoldDirection,
  type GoldTradeInput,
  type GoldUnit,
} from "@/services/gold-trading-api";

const units: GoldUnit[] = ["damlung", "chi", "hun"];
const hunPerDamlung: Record<GoldUnit, number> = {
  damlung: 100,
  chi: 10,
  hun: 1,
};

function pricePerUnit(pricePerDamlung: string, unit: GoldUnit): string {
  return (Number(pricePerDamlung) * hunPerDamlung[unit] / hunPerDamlung.damlung).toFixed(6);
}

function formatUsd(value: string | null | undefined, locale: string): string {
  if (value === null || value === undefined) return "—";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(amount)
    : "—";
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(locale);
}

function profitClass(value: string | null): string {
  if (value === null) return "text-muted";
  return Number(value) < 0 ? "text-rose-400" : "text-emerald-400";
}

function formatProfit(value: string | null, locale: string): string {
  if (value === null) return "—";
  const formatted = formatUsd(value, locale);
  return Number(value) > 0 ? `+${formatted}` : formatted;
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
  emphasize = false,
  amount,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "blue" | "violet" | "gold" | "green" | "accent";
  emphasize?: boolean;
  amount?: string | null;
}) {
  return (
    <div className="gold-metric-card" data-tone={tone}>
      <span className="gold-metric-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs leading-snug text-muted">{label}</span>
        <span className={`mt-1 block truncate ${emphasize ? "text-lg" : "text-base"} font-bold tabular-nums ${emphasize ? profitClass(amount ?? null) : ""}`}>
          {value}
        </span>
      </span>
    </div>
  );
}

function TradeFields({
  unit,
  setUnit,
  quantity,
  setQuantity,
  price,
  setPrice,
  note,
  setNote,
}: {
  unit: GoldUnit;
  setUnit: (value: GoldUnit) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <>
      <label className="block space-y-1.5 text-xs text-muted">
        {t("quantityUnit")}
        <div className="flex gap-2">
          <span className="gold-field-control">
            <span className="gold-field-icon" aria-hidden="true"><Wallet size={17} /></span>
            <Input
              className="gold-field-input"
              required
              type="text"
              inputMode="decimal"
              pattern="(?:[0-9]+(?:[.][0-9]{1,8})?|[.][0-9]{1,8})"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder={t("quantityPlaceholder")}
            />
          </span>
          <select
            className="h-12 rounded-full border border-border bg-surface-strong px-4 text-sm text-foreground"
            value={unit}
            onChange={(event) => {
              setUnit(event.target.value as GoldUnit);
              setPrice("");
            }}
            aria-label={t("quantityUnit")}
          >
            {units.map((goldUnit) => (
              <option key={goldUnit} value={goldUnit}>
                {t(goldUnit === "damlung" ? "damlungUnit" : goldUnit === "chi" ? "chiUnit" : "hunUnit")}
              </option>
            ))}
          </select>
        </div>
      </label>
      <label className="block space-y-1.5 text-xs text-muted">
        {t("pricePerUnit", {
          unit: t(unit === "damlung" ? "damlungUnit" : unit === "chi" ? "chiUnit" : "hunUnit"),
        })}
        <span className="gold-field-control">
          <span className="gold-field-icon gold-field-icon-cyan" aria-hidden="true"><Coins size={17} /></span>
          <Input
            className="gold-field-input"
            required
            type="number"
            min="0.000001"
            step="any"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder={t("unitPricePlaceholder", {
              unit: t(unit === "damlung" ? "damlungUnit" : unit === "chi" ? "chiUnit" : "hunUnit"),
            })}
          />
        </span>
      </label>
      <label className="block space-y-1.5 text-xs text-muted">
        {t("noteOptional")}
        <span className="gold-field-control">
          <span className="gold-field-icon gold-field-icon-violet" aria-hidden="true"><Pencil size={17} /></span>
          <Input
            className="gold-field-input"
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("notePlaceholder")}
          />
        </span>
      </label>
    </>
  );
}

export function GoldTrading() {
  const { telegram, profile } = useTelegram();
  const { t, locale } = useLanguage();
  const initData = telegram?.initData || "";
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState("profit_loss");
  const [order, setOrder] = useState("desc");
  const [purchaseUnit, setPurchaseUnit] = useState<GoldUnit>("chi");
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseNote, setPurchaseNote] = useState("");
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [sellingPurchaseId, setSellingPurchaseId] = useState<number | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [alertTarget, setAlertTarget] = useState("");
  const [alertDirection, setAlertDirection] = useState<GoldDirection>("ABOVE");
  const [notice, setNotice] = useState("");

  const overviewQuery = useQuery({
    queryKey: ["gold-overview", initData, sortBy, order],
    queryFn: () => getGoldOverview(initData, sortBy, order),
    enabled: Boolean(initData),
    refetchInterval: 60_000,
  });
  const alertsQuery = useQuery({
    queryKey: ["gold-price-alerts", initData],
    queryFn: () => getGoldAlerts(initData),
    enabled: Boolean(initData),
    refetchInterval: 60_000,
  });
  const invalidateGoldData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["gold-overview", initData] }),
      queryClient.invalidateQueries({ queryKey: ["gold-price-alerts", initData] }),
    ]);
  };
  const savePurchase = useMutation({
    mutationFn: (input: GoldTradeInput) => editingPurchaseId
      ? updateGoldPurchase(initData, editingPurchaseId, input)
      : createGoldPurchase(initData, input),
    onSuccess: async (result) => {
      const alerted = "telegram_alert_sent" in result ? result.telegram_alert_sent : true;
      setNotice(alerted ? t("purchaseSaved") : t("purchaseSavedNoAlert"));
      setEditingPurchaseId(null);
      setPurchaseQuantity("");
      setPurchasePrice("");
      setPurchaseNote("");
      await invalidateGoldData();
    },
  });
  const removePurchase = useMutation({
    mutationFn: (id: number) => deleteGoldPurchase(initData, id),
    onSuccess: async () => {
      setNotice(t("purchaseDeleted"));
      await invalidateGoldData();
    },
  });
  const sellPurchase = useMutation({
    mutationFn: ({ id, unitPrice }: { id: number; unitPrice: string }) =>
      sellGoldPurchase(initData, id, unitPrice),
    onSuccess: async (result) => {
      setNotice(
        result.telegram_alert_sent
          ? t("saleRecorded", { amount: formatUsd(result.realized_profit_loss, locale) })
          : t("saleRecordedNoAlert", { amount: formatUsd(result.realized_profit_loss, locale) }),
      );
      setSellingPurchaseId(null);
      setSellPrice("");
      await invalidateGoldData();
    },
  });
  const saveAlert = useMutation({
    mutationFn: () => createGoldPriceAlert(initData, alertTarget, alertDirection),
    onSuccess: async () => {
      setAlertTarget("");
      setNotice(t("alertCreated"));
      await invalidateGoldData();
    },
  });
  const removeAlert = useMutation({
    mutationFn: (id: number) => deleteGoldPriceAlert(initData, id),
    onSuccess: async () => {
      setNotice(t("alertDeleted"));
      await invalidateGoldData();
    },
  });

  function onSavePurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    savePurchase.mutate({
      unit: purchaseUnit,
      quantity: purchaseQuantity,
      unit_price: purchasePrice,
      note: purchaseNote,
    });
  }

  function editPurchase(holding: NonNullable<typeof overviewQuery.data>["holdings"][number]) {
    if (!holding.can_edit) {
      setNotice(t("partiallySoldCannotEdit"));
      return;
    }
    setEditingPurchaseId(holding.id);
    setPurchaseUnit(holding.unit);
    setPurchaseQuantity(holding.quantity);
    setPurchasePrice(pricePerUnit(holding.unit_price_per_damlung, holding.unit));
    setPurchaseNote(holding.note);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const overview = overviewQuery.data;
  const summary = overview?.summary;
  const isPending = savePurchase.isPending || removePurchase.isPending ||
    sellPurchase.isPending || saveAlert.isPending || removeAlert.isPending;
  const mutationError = savePurchase.error || removePurchase.error || sellPurchase.error ||
    saveAlert.error || removeAlert.error;

  return (
    <main className="gold-dashboard mx-auto w-full max-w-[520px] space-y-4">
      <AppHeader profile={profile} title={t("goldTrading")} subtitle={t("goldSubtitle")} brandIcon={ChartNoAxesCombined} brandVariant="gold" />

      <Card className="gold-price-hero">
        <CardContent className="gold-price-content">
          <span className="gold-price-icon" aria-hidden="true">
            <Coins size={27} strokeWidth={2.1} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/75">{t("goldPrice")}</p>
            <p className="gold-price-amount">
              {overview?.current_price
                ? `${formatUsd(overview.current_price.price_per_damlung, locale)} / ${t("damlungUnit")}`
                : t("priceUnavailable")}
            </p>
            {!overview?.current_price && (
              <p className="mt-1 text-xs text-white/70">{t("adminMustSetPrice")}</p>
            )}
            {overview?.current_price && (
              <p className="gold-price-updated">
                {t("updated", { date: formatUtcTimestamp(overview.current_price.updated_on, locale) })}
              </p>
            )}
          </div>
          <ChartNoAxesCombined className="gold-price-decoration" aria-hidden="true" />
        </CardContent>
      </Card>

      {summary && (
        <>
        <section className="gold-metrics-grid" aria-label="Gold portfolio summary">
          <Metric
            label={t("goldHeld")}
            value={`${new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(Number(summary.quantity_hun) / 100)} ${t("damlungUnit")}`}
            icon={Wallet}
            tone="blue"
          />
          <Metric label={t("costBasis")} value={formatUsd(summary.cost_basis, locale)} icon={Scale} tone="violet" />
          <Metric label={t("currentValue")} value={formatUsd(summary.market_value, locale)} icon={Coins} tone="gold" />
          <Metric
            label={t("realizedPL")}
            value={formatProfit(summary.realized_profit_loss, locale)}
            emphasize
            amount={summary.realized_profit_loss}
            icon={ArrowUpFromLine}
            tone="green"
          />
          <Metric
            label={t("unrealizedPL")}
            value={formatProfit(summary.unrealized_profit_loss, locale)}
            emphasize
            amount={summary.unrealized_profit_loss}
            icon={ChartNoAxesCombined}
            tone="accent"
          />
        </section>
        <Card className="gold-profit-hero">
          <CardContent className="gold-profit-content">
            <span className="gold-profit-icon" aria-hidden="true">
              <ChartNoAxesCombined size={27} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/75">{t("totalProfitLoss")}</p>
              <p className={`gold-profit-amount ${Number(summary.total_profit_loss) < 0 ? "text-rose-200" : ""}`}>
                {formatProfit(summary.total_profit_loss, locale)}
              </p>
              <div className="gold-profit-breakdown">
                <span>{t("realizedPL")}: {formatProfit(summary.realized_profit_loss, locale)}</span>
                <span>{t("unrealizedPL")}: {formatProfit(summary.unrealized_profit_loss, locale)}</span>
              </div>
            </div>
            <ChartNoAxesCombined className="gold-profit-decoration" aria-hidden="true" />
          </CardContent>
        </Card>
        </>
      )}

      <Card className="gold-trade-form">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="gold-section-icon" aria-hidden="true"><FileText size={17} /></span>
            {editingPurchaseId ? t("editPurchase") : t("recordPurchase")}
          </CardTitle>
          <CardDescription>
            {t("unitConversions")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSavePurchase}>
            <TradeFields
              unit={purchaseUnit}
              setUnit={setPurchaseUnit}
              quantity={purchaseQuantity}
              setQuantity={setPurchaseQuantity}
              price={purchasePrice}
              setPrice={setPurchasePrice}
              note={purchaseNote}
              setNote={setPurchaseNote}
            />
            <div className="flex gap-2">
              <Button className="gold-primary-action w-full" disabled={isPending} type="submit" variant="primary">
                <ArrowDownToLine aria-hidden="true" size={16} />
                {editingPurchaseId ? t("saveChanges") : t("addPurchase")}
              </Button>
              {editingPurchaseId && (
                <Button
                  onClick={() => setEditingPurchaseId(null)}
                  type="button"
                >
                  {t("cancel")}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {notice && <p className="gold-notice rounded-xl px-4 py-3 text-sm">{notice}</p>}
      {mutationError && (
        <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          {mutationError.message}
        </p>
      )}
      {overviewQuery.error && (
        <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          {overviewQuery.error.message}
        </p>
      )}
      {alertsQuery.error && (
        <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          {alertsQuery.error.message}
        </p>
      )}

      <Card className="gold-list-card gold-records-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="gold-card-heading">
              <span className="gold-card-heading-icon" aria-hidden="true"><Wallet size={17} /></span>
              <span>
              <CardTitle>{t("purchaseRecords")}</CardTitle>
              <CardDescription>{t("openPurchasesDescription")}</CardDescription>
              </span>
            </div>
            <select
              className="gold-sort-select h-10 max-w-36 rounded-xl border border-border bg-surface-strong px-2 text-xs text-foreground"
              value={`${sortBy}:${order}`}
              onChange={(event) => {
                const [nextSort, nextOrder] = event.target.value.split(":");
                setSortBy(nextSort);
                setOrder(nextOrder);
              }}
              aria-label={t("sortHoldings")}
            >
              <option value="profit_loss:desc">{t("bestPL")}</option>
              <option value="profit_loss:asc">{t("worstPL")}</option>
              <option value="created_on:desc">{t("newestFirst")}</option>
              <option value="created_on:asc">{t("oldestFirst")}</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {overviewQuery.isPending && <p className="gold-empty-state text-sm text-muted">{t("loadingPortfolio")}</p>}
          {overview && overview.holdings.length === 0 && (
            <p className="gold-empty-state text-sm text-muted">{t("noPurchases")}</p>
          )}
          {overview?.holdings.map((holding) => {
            const fullyAvailable = holding.can_edit;
            const purchasedQuantity = `${new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(Number(holding.quantity))} ${t(holding.unit === "damlung" ? "damlungUnit" : holding.unit === "chi" ? "chiUnit" : "hunUnit")}`;
            const remainingQuantity = `${new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(Number(holding.remaining_quantity))} ${t(holding.unit === "damlung" ? "damlungUnit" : holding.unit === "chi" ? "chiUnit" : "hunUnit")}`;
            const returnPercent = holding.profit_loss === null
              ? null
              : (Number(holding.profit_loss) / Number(holding.total_cost)) * 100;
            const resultLabel = holding.profit_loss === null
              ? t("sortProfitLoss")
              : Number(holding.profit_loss) > 0
                ? t("profit")
                : Number(holding.profit_loss) < 0
                  ? t("loss")
                  : t("breakEven");
            const holdingUnitLabel = t(
              holding.unit === "damlung" ? "damlungUnit" : holding.unit === "chi" ? "chiUnit" : "hunUnit",
            );
            const sellButtonLabel = t("sellPurchase");
            const suggestedSellPrice = overview.current_price
              ? pricePerUnit(overview.current_price.price_per_damlung, holding.unit)
              : null;
            return (
              <article key={holding.id} className="gold-holding-card">
                <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{t("purchaseRecord")} #{holding.id}</p>
                    <p className="mt-1 text-xs text-muted">{formatDate(holding.created_on, locale)}</p>
                  </div>
                  <div
                    className="gold-result-pill shrink-0 rounded-xl px-3 py-2 text-right"
                    data-result={holding.profit_loss === null ? "neutral" : Number(holding.profit_loss) < 0 ? "loss" : "profit"}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide">{resultLabel}</p>
                    <p className="mt-0.5 text-sm font-bold tabular-nums">
                      {formatProfit(holding.profit_loss, locale)}
                    </p>
                    {returnPercent !== null && (
                      <p className="mt-0.5 text-[10px] font-medium">
                        {t("returnPercent")}: {returnPercent > 0 ? "+" : ""}
                        {new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(returnPercent)}%
                      </p>
                    )}
                  </div>
                </div>
                <div className="gold-detail-grid mt-3 grid grid-cols-2 gap-2">
                  <div className="gold-detail-item" data-tone="cyan">
                    <p className="text-[11px] text-muted">{t("investedPrincipal")}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatUsd(holding.total_cost, locale)}</p>
                  </div>
                  <div className="gold-detail-item" data-tone="blue">
                    <p className="text-[11px] text-muted">{t("remainingCost")}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatUsd(holding.cost_basis, locale)}</p>
                  </div>
                  <div className="gold-detail-item" data-tone="violet">
                    <p className="text-[11px] text-muted">{t("remainingQuantity")}</p>
                    <p className="mt-0.5 text-sm font-semibold">{remainingQuantity}</p>
                  </div>
                  <div className="gold-detail-item" data-tone="gold">
                    <p className="text-[11px] text-muted">{t("currentValue")}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatUsd(holding.market_value, locale)}</p>
                  </div>
                </div>
                <div className="gold-purchase-meta mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
                  <span className="text-muted">{t("boughtQuantity", { quantity: purchasedQuantity })}</span>
                  <span className="font-medium">{t("buyRate")} {formatUsd(pricePerUnit(holding.unit_price_per_damlung, holding.unit), locale)} / {t(holding.unit === "damlung" ? "damlungUnit" : holding.unit === "chi" ? "chiUnit" : "hunUnit")}</span>
                </div>
                {holding.note && <p className="gold-holding-note mt-2 text-xs text-muted">{holding.note}</p>}
                <div className="mt-3 flex justify-end gap-2">
                  {Number(holding.remaining_hun) > 0 && (
                    <Button
                      aria-label={sellButtonLabel}
                      className="gold-action-sell"
                      disabled={isPending}
                      onClick={() => {
                        setNotice("");
                        setSellingPurchaseId(holding.id);
                        setSellPrice(
                          overview.current_price
                            ? pricePerUnit(overview.current_price.price_per_damlung, holding.unit)
                            : "",
                        );
                      }}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <ArrowUpFromLine aria-hidden="true" size={14} />
                      {t("sell")}
                    </Button>
                  )}
                  <Button
                    aria-label={t("editPurchase")}
                    className="gold-action-edit"
                    disabled={!fullyAvailable || isPending}
                    onClick={() => editPurchase(holding)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Pencil aria-hidden="true" size={14} /> {t("edit")}
                  </Button>
                  <Button
                    aria-label={t("delete")}
                    className="gold-action-delete"
                    disabled={!fullyAvailable || isPending}
                    onClick={() => {
                      if (window.confirm(t("deletePurchaseConfirm"))) removePurchase.mutate(holding.id);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Trash2 aria-hidden="true" size={14} /> {t("delete")}
                  </Button>
                </div>
                {sellingPurchaseId === holding.id && (
                  <form
                    className="gold-sell-form mt-3 space-y-3 rounded-xl border border-border bg-surface p-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setNotice("");
                      sellPurchase.mutate({ id: holding.id, unitPrice: sellPrice });
                    }}
                  >
                    <p className="text-sm font-medium">
                      {t("sellRemaining", { quantity: remainingQuantity })}
                    </p>
                    <p className="text-xs text-muted">
                      {t("sellPriceHint", {
                        price: suggestedSellPrice
                          ? `${formatUsd(suggestedSellPrice, locale)} / ${holdingUnitLabel}`
                          : t("priceUnavailable"),
                      })}
                    </p>
                    <label className="block space-y-1.5 text-xs text-muted">
                      {t("salePricePerUnit", {
                        unit: holdingUnitLabel,
                      })}
                      <Input
                        required
                        type="number"
                        min="0.000001"
                        step="any"
                        value={sellPrice}
                        onChange={(event) => setSellPrice(event.target.value)}
                        placeholder={t("unitPricePlaceholder", {
                          unit: holdingUnitLabel,
                        })}
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button
                        disabled={sellPurchase.isPending}
                        onClick={() => {
                          setSellingPurchaseId(null);
                          setSellPrice("");
                        }}
                        type="button"
                        variant="outline"
                      >
                        {t("cancel")}
                      </Button>
                      <Button disabled={sellPurchase.isPending} type="submit" variant="primary">
                        {t("confirmSale")}
                      </Button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </CardContent>
      </Card>

      <Card className="gold-list-card gold-report-card">
        <CardHeader>
          <div className="gold-card-heading">
            <span className="gold-card-heading-icon gold-heading-violet" aria-hidden="true">
              <ChartNoAxesCombined size={17} />
            </span>
            <span>
              <CardTitle>{t("report")}</CardTitle>
              <CardDescription>{t("fifoDescription")}</CardDescription>
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="gold-subsection-title text-sm font-medium">{t("transactionHistory")}</p>
            <select
              className="gold-sort-select h-10 rounded-xl border border-border bg-surface-strong px-2 text-xs text-foreground"
              value={`${sortBy}:${order}`}
              onChange={(event) => {
                const [nextSort, nextOrder] = event.target.value.split(":");
                setSortBy(nextSort);
                setOrder(nextOrder);
              }}
              aria-label={t("sortTransactions")}
            >
              <option value="profit_loss:desc">{t("highestPL")}</option>
              <option value="profit_loss:asc">{t("lowestPL")}</option>
              <option value="created_on:desc">{t("newestFirst")}</option>
              <option value="created_on:asc">{t("oldestFirst")}</option>
            </select>
          </div>
          {!overview?.transactions.length && (
            <p className="gold-empty-state text-sm text-muted">{t("historyEmpty")}</p>
          )}
          {overview?.transactions.map((transaction) => (
            <div key={transaction.id} className="gold-transaction-row flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <span className="gold-transaction-type" data-type={transaction.type}>
                    {transaction.type === "BUY" ? t("bought") : t("sold")}
                  </span>
                  {transaction.quantity} {t(transaction.unit === "damlung" ? "damlungUnit" : transaction.unit === "chi" ? "chiUnit" : "hunUnit")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(transaction.created_on, locale)} · {formatUsd(pricePerUnit(transaction.unit_price_per_damlung, transaction.unit), locale)} / {t(transaction.unit === "damlung" ? "damlungUnit" : transaction.unit === "chi" ? "chiUnit" : "hunUnit")}
                </p>
              </div>
              <p
                className={`gold-transaction-result shrink-0 text-sm font-semibold ${profitClass(transaction.profit_loss)}`}
                data-result={transaction.profit_loss === null ? "neutral" : Number(transaction.profit_loss) < 0 ? "loss" : "profit"}
              >
                {formatUsd(transaction.profit_loss, locale)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="gold-list-card gold-alerts-card">
        <CardHeader>
          <div className="gold-card-heading">
            <span className="gold-card-heading-icon gold-heading-gold" aria-hidden="true"><Bell size={17} /></span>
            <span>
              <CardTitle>{t("priceAlerts")}</CardTitle>
              <CardDescription>{t("alertsDescription")}</CardDescription>
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            className="gold-alert-form flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              saveAlert.mutate();
            }}
          >
            <span className="gold-alert-target">
              <span className="gold-field-icon gold-field-icon-cyan" aria-hidden="true"><Coins size={17} /></span>
              <Input
                required
                min="0.000001"
                step="any"
                type="number"
                aria-label={t("alertTarget")}
                placeholder={t("usdDamlungPlaceholder")}
                value={alertTarget}
                onChange={(event) => setAlertTarget(event.target.value)}
              />
            </span>
            <select
              className="gold-alert-direction h-12 rounded-xl border border-border bg-surface-strong px-3 text-sm text-foreground"
              value={alertDirection}
              onChange={(event) => setAlertDirection(event.target.value as GoldDirection)}
              aria-label={t("alertDirection")}
            >
              <option value="ABOVE">{t("atOrAbove")}</option>
              <option value="BELOW">{t("atOrBelow")}</option>
            </select>
            <Button className="gold-alert-submit" disabled={isPending} type="submit">
              <Bell aria-hidden="true" size={15} /> {t("setAlert")}
            </Button>
          </form>
          {alertsQuery.data?.map((alert) => (
            <div key={alert.id} className="gold-alert-row flex items-center justify-between gap-3" data-status={alert.triggered_on ? "triggered" : "waiting"}>
              <div>
                <p className="text-sm font-medium">
                  {alert.direction === "ABOVE" ? t("atOrAbove") : t("atOrBelow")} {formatUsd(alert.target_price_per_damlung, locale)}
                </p>
                <p className="text-xs text-muted">
                  {alert.triggered_on
                    ? t("triggered", { date: formatDate(alert.triggered_on, locale) })
                    : t("waitingForPrice")}
                </p>
              </div>
              <Button
                aria-label={t("deleteAlert")}
                className="gold-action-delete"
                disabled={isPending}
                onClick={() => removeAlert.mutate(alert.id)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" size={16} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
