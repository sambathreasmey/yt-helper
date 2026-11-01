"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Bell, Coins, Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTelegram } from "@/hooks/use-telegram";
import { useLanguage } from "@/providers/language-provider";
import {
  createGoldPriceAlert,
  createGoldPurchase,
  createGoldSale,
  deleteGoldPriceAlert,
  deleteGoldPurchase,
  getGoldAlerts,
  getGoldOverview,
  updateGoldPurchase,
  type GoldDirection,
  type GoldTradeInput,
  type GoldUnit,
} from "@/services/gold-trading-api";

const units: GoldUnit[] = ["damlung", "chi", "hun"];

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
  emphasize = false,
  amount,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  amount?: string | null;
}) {
  return (
    <div className={`rounded-2xl border p-3 ${
      emphasize
        ? amount === null || amount === undefined
          ? "border-border bg-surface-strong"
          : Number(amount) < 0
            ? "border-rose-500/25 bg-rose-500/10"
            : "border-emerald-500/25 bg-emerald-500/10"
        : "border-border bg-surface-strong"
    }`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 ${emphasize ? "text-xl" : "text-lg"} font-bold tabular-nums ${emphasize ? profitClass(amount ?? null) : ""}`}>
        {value}
      </p>
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
          <Input
            required
            type="text"
            inputMode="decimal"
            pattern="(?:[0-9]+(?:\\.[0-9]{1,8})?|\\.[0-9]{1,8})"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder={t("quantityPlaceholder")}
          />
          <select
            className="h-12 rounded-xl border border-border bg-surface-strong px-3 text-sm text-foreground"
            value={unit}
            onChange={(event) => setUnit(event.target.value as GoldUnit)}
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
        {t("pricePerDamlung")}
        <Input
          required
          type="number"
          min="0.000001"
          step="any"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder={t("usdDamlungPlaceholder")}
        />
      </label>
      <label className="block space-y-1.5 text-xs text-muted">
        {t("noteOptional")}
        <Input
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("notePlaceholder")}
        />
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
  const [saleUnit, setSaleUnit] = useState<GoldUnit>("chi");
  const [saleQuantity, setSaleQuantity] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleNote, setSaleNote] = useState("");
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
  const saveSale = useMutation({
    mutationFn: (input: GoldTradeInput) => createGoldSale(initData, input),
    onSuccess: async (result) => {
      setNotice(
        result.telegram_alert_sent
          ? t("saleRecorded", { amount: formatUsd(result.realized_profit_loss, locale) })
          : t("saleRecordedNoAlert", { amount: formatUsd(result.realized_profit_loss, locale) }),
      );
      setSaleQuantity("");
      setSalePrice("");
      setSaleNote("");
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
      unit_price_per_damlung: purchasePrice,
      note: purchaseNote,
    });
  }

  function onSaveSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    saveSale.mutate({
      unit: saleUnit,
      quantity: saleQuantity,
      unit_price_per_damlung: salePrice,
      note: saleNote,
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
    setPurchasePrice(holding.unit_price_per_damlung);
    setPurchaseNote(holding.note);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const overview = overviewQuery.data;
  const summary = overview?.summary;
  const isPending = savePurchase.isPending || removePurchase.isPending ||
    saveSale.isPending || saveAlert.isPending || removeAlert.isPending;
  const mutationError = savePurchase.error || removePurchase.error || saveSale.error ||
    saveAlert.error || removeAlert.error;

  return (
    <main className="mx-auto w-full max-w-[520px] space-y-4">
      <AppHeader profile={profile} title={t("goldTrading")} subtitle={t("goldSubtitle")} />

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Coins aria-hidden="true" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">{t("goldPrice")}</p>
            <p className="mt-1 text-xl font-bold">
              {overview?.current_price
                ? `${formatUsd(overview.current_price.price_per_damlung, locale)} / ${t("damlungUnit")}`
                : t("priceUnavailable")}
            </p>
            {!overview?.current_price && (
              <p className="mt-1 text-xs text-muted">{t("adminMustSetPrice")}</p>
            )}
            {overview?.current_price && (
              <p className="mt-1 text-xs text-muted">
                {t("updated", { date: formatDate(overview.current_price.updated_on, locale) })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {summary && (
        <section className="grid grid-cols-2 gap-3" aria-label="Gold portfolio summary">
          <Metric
            label={t("goldHeld")}
            value={`${new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(Number(summary.quantity_hun) / 100)} ${t("damlungUnit")}`}
          />
          <Metric label={t("costBasis")} value={formatUsd(summary.cost_basis, locale)} />
          <Metric label={t("currentValue")} value={formatUsd(summary.market_value, locale)} />
          <Metric
            label={t("totalProfitLoss")}
            value={formatProfit(summary.total_profit_loss, locale)}
            emphasize
            amount={summary.total_profit_loss}
          />
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{editingPurchaseId ? t("editPurchase") : t("recordPurchase")}</CardTitle>
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
              <Button className="w-full" disabled={isPending} type="submit" variant="primary">
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

      <Card>
        <CardHeader>
          <CardTitle>{t("recordSale")}</CardTitle>
          <CardDescription>{t("saleDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSaveSale}>
            <TradeFields
              unit={saleUnit}
              setUnit={setSaleUnit}
              quantity={saleQuantity}
              setQuantity={setSaleQuantity}
              price={salePrice}
              setPrice={setSalePrice}
              note={saleNote}
              setNote={setSaleNote}
            />
            <Button className="w-full" disabled={isPending} type="submit" variant="primary">
              <ArrowUpFromLine aria-hidden="true" size={16} />
              {t("submitSale")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {notice && <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm">{notice}</p>}
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>{t("purchaseRecords")}</CardTitle>
              <CardDescription>{t("openPurchasesDescription")}</CardDescription>
            </div>
            <select
              className="h-10 max-w-36 rounded-xl border border-border bg-surface-strong px-2 text-xs text-foreground"
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
          {overviewQuery.isPending && <p className="text-sm text-muted">{t("loadingPortfolio")}</p>}
          {overview && overview.holdings.length === 0 && (
            <p className="text-sm text-muted">{t("noPurchases")}</p>
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
            return (
              <article key={holding.id} className="rounded-2xl border border-border bg-surface-strong p-3.5">
                <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{t("purchaseRecord")} #{holding.id}</p>
                    <p className="mt-1 text-xs text-muted">{formatDate(holding.created_on, locale)}</p>
                  </div>
                  <div className={`shrink-0 rounded-xl px-3 py-2 text-right ${holding.profit_loss === null ? "bg-surface text-muted" : Number(holding.profit_loss) < 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
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
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
                  <div>
                    <p className="text-[11px] text-muted">{t("investedPrincipal")}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatUsd(holding.total_cost, locale)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">{t("remainingCost")}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatUsd(holding.cost_basis, locale)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">{t("remainingQuantity")}</p>
                    <p className="mt-0.5 text-sm font-semibold">{remainingQuantity}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted">{t("currentValue")}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatUsd(holding.market_value, locale)}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
                  <span className="text-muted">{t("boughtQuantity", { quantity: purchasedQuantity })}</span>
                  <span className="font-medium">{t("buyRate")} {formatUsd(holding.unit_price_per_damlung, locale)} / {t("damlungUnit")}</span>
                </div>
                {holding.note && <p className="mt-2 text-xs text-muted">{holding.note}</p>}
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    aria-label={t("editPurchase")}
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
              </article>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("report")}</CardTitle>
          <CardDescription>{t("fifoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{t("transactionHistory")}</p>
            <select
              className="h-10 rounded-xl border border-border bg-surface-strong px-2 text-xs text-foreground"
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
            <p className="text-sm text-muted">{t("historyEmpty")}</p>
          )}
          {overview?.transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <div>
                <p className="text-sm font-medium">
                  {transaction.type === "BUY" ? t("bought") : t("sold")} {transaction.quantity} {t(transaction.unit === "damlung" ? "damlungUnit" : transaction.unit === "chi" ? "chiUnit" : "hunUnit")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(transaction.created_on, locale)} · {formatUsd(transaction.unit_price_per_damlung, locale)} / {t("damlungUnit")}
                </p>
              </div>
              <p className={`shrink-0 text-sm font-semibold ${profitClass(transaction.profit_loss)}`}>
                {formatUsd(transaction.profit_loss, locale)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("priceAlerts")}</CardTitle>
          <CardDescription>{t("alertsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              saveAlert.mutate();
            }}
          >
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
            <select
              className="h-12 rounded-xl border border-border bg-surface-strong px-3 text-sm text-foreground"
              value={alertDirection}
              onChange={(event) => setAlertDirection(event.target.value as GoldDirection)}
              aria-label={t("alertDirection")}
            >
              <option value="ABOVE">{t("atOrAbove")}</option>
              <option value="BELOW">{t("atOrBelow")}</option>
            </select>
            <Button disabled={isPending} type="submit">
              <Bell aria-hidden="true" size={15} /> {t("setAlert")}
            </Button>
          </form>
          {alertsQuery.data?.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between gap-3 border-t border-border pt-3">
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
