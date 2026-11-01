"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Bell, Coins, Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTelegram } from "@/hooks/use-telegram";
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

function formatUsd(value: string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
    : "—";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function profitClass(value: string | null): string {
  if (value === null) return "text-muted";
  return Number(value) < 0 ? "text-rose-400" : "text-emerald-400";
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
    <div className="rounded-2xl border border-border bg-surface-strong p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${emphasize ? profitClass(amount ?? null) : ""}`}>
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
  return (
    <>
      <label className="block space-y-1.5 text-xs text-muted">
        Quantity and Khmer unit
        <div className="flex gap-2">
          <Input
            required
            type="number"
            min="0.00000001"
            step="any"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Quantity"
          />
          <select
            className="h-12 rounded-xl border border-border bg-surface-strong px-3 text-sm text-foreground"
            value={unit}
            onChange={(event) => setUnit(event.target.value as GoldUnit)}
            aria-label="Gold unit"
          >
            {units.map((goldUnit) => <option key={goldUnit} value={goldUnit}>{goldUnit}</option>)}
          </select>
        </div>
      </label>
      <label className="block space-y-1.5 text-xs text-muted">
        Price per damlung (USD)
        <Input
          required
          type="number"
          min="0.000001"
          step="any"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="USD / damlung"
        />
      </label>
      <label className="block space-y-1.5 text-xs text-muted">
        Note (optional)
        <Input
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Shop, receipt, or other details"
        />
      </label>
    </>
  );
}

export function GoldTrading() {
  const { telegram, profile } = useTelegram();
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
      setNotice(alerted ? "Purchase saved." : "Purchase saved, but Telegram could not send the alert.");
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
      setNotice("Purchase deleted.");
      await invalidateGoldData();
    },
  });
  const saveSale = useMutation({
    mutationFn: (input: GoldTradeInput) => createGoldSale(initData, input),
    onSuccess: async (result) => {
      setNotice(
        result.telegram_alert_sent
          ? `Sale recorded. Realized P/L: ${formatUsd(result.realized_profit_loss)}`
          : `Sale recorded (${formatUsd(result.realized_profit_loss)} realized P/L), but Telegram could not send the alert.`,
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
      setNotice("Price alert created.");
      await invalidateGoldData();
    },
  });
  const removeAlert = useMutation({
    mutationFn: (id: number) => deleteGoldPriceAlert(initData, id),
    onSuccess: async () => {
      setNotice("Price alert deleted.");
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
      setNotice("A purchase with a partial sale cannot be edited.");
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
      <AppHeader profile={profile} title="Gold trading" subtitle="Manage your gold holdings" />

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Coins aria-hidden="true" size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Current gold price</p>
            <p className="mt-1 text-xl font-bold">
              {overview?.current_price
                ? `${formatUsd(overview.current_price.price_per_damlung)} / damlung`
                : "Price not available"}
            </p>
            {!overview?.current_price && (
              <p className="mt-1 text-xs text-muted">An administrator must set the shared price.</p>
            )}
            {overview?.current_price && (
              <p className="mt-1 text-xs text-muted">
                Updated {formatDate(overview.current_price.updated_on)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {summary && (
        <section className="grid grid-cols-2 gap-3" aria-label="Gold portfolio summary">
          <Metric label="Gold held" value={`${Number(summary.quantity_hun) / 100} damlung`} />
          <Metric label="Cost basis" value={formatUsd(summary.cost_basis)} />
          <Metric label="Current value" value={formatUsd(summary.market_value)} />
          <Metric
            label="Total profit / loss"
            value={formatUsd(summary.total_profit_loss)}
            emphasize
            amount={summary.total_profit_loss}
          />
          <Metric
            label="Realized P/L"
            value={formatUsd(summary.realized_profit_loss)}
            emphasize
            amount={summary.realized_profit_loss}
          />
          <Metric
            label="Unrealized P/L"
            value={formatUsd(summary.unrealized_profit_loss)}
            emphasize
            amount={summary.unrealized_profit_loss}
          />
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{editingPurchaseId ? "Edit gold purchase" : "Record gold purchase"}</CardTitle>
          <CardDescription>
            1 damlung = 10 chi = 100 hun. Trade prices are entered per damlung in USD.
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
                {editingPurchaseId ? "Save changes" : "Add purchase"}
              </Button>
              {editingPurchaseId && (
                <Button
                  onClick={() => setEditingPurchaseId(null)}
                  type="button"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Record a sale</CardTitle>
          <CardDescription>Sale proceeds and realized P/L use FIFO purchase cost.</CardDescription>
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
              Record sale
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
              <CardTitle>Gold holdings</CardTitle>
              <CardDescription>Open purchases with market value and unrealized P/L.</CardDescription>
            </div>
            <select
              className="h-10 max-w-36 rounded-xl border border-border bg-surface-strong px-2 text-xs text-foreground"
              value={`${sortBy}:${order}`}
              onChange={(event) => {
                const [nextSort, nextOrder] = event.target.value.split(":");
                setSortBy(nextSort);
                setOrder(nextOrder);
              }}
              aria-label="Sort holdings"
            >
              <option value="profit_loss:desc">Best P/L</option>
              <option value="profit_loss:asc">Worst P/L</option>
              <option value="created_on:desc">Newest first</option>
              <option value="created_on:asc">Oldest first</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {overviewQuery.isPending && <p className="text-sm text-muted">Loading portfolio…</p>}
          {overview && overview.holdings.length === 0 && (
            <p className="text-sm text-muted">No gold purchases yet. Record a purchase to start tracking.</p>
          )}
          {overview?.holdings.map((holding) => {
            const fullyAvailable = holding.can_edit;
            return (
              <article key={holding.id} className="rounded-2xl border border-border bg-surface-strong p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {holding.remaining_quantity} {holding.unit}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Buy rate {formatUsd(holding.unit_price_per_damlung)} / damlung · {formatDate(holding.created_on)}
                    </p>
                    {holding.note && <p className="mt-1 text-xs text-muted">{holding.note}</p>}
                  </div>
                  <p className={`text-sm font-semibold ${profitClass(holding.profit_loss)}`}>
                    {formatUsd(holding.profit_loss)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Value {formatUsd(holding.market_value)} · Cost {formatUsd(holding.cost_basis)}
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    aria-label="Edit purchase"
                    disabled={!fullyAvailable || isPending}
                    onClick={() => editPurchase(holding)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Pencil aria-hidden="true" size={14} /> Edit
                  </Button>
                  <Button
                    aria-label="Delete purchase"
                    disabled={!fullyAvailable || isPending}
                    onClick={() => {
                      if (window.confirm("Delete this purchase?")) removePurchase.mutate(holding.id);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Trash2 aria-hidden="true" size={14} /> Delete
                  </Button>
                </div>
              </article>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit / loss report</CardTitle>
          <CardDescription>Sales are matched to purchases in FIFO order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Transaction history</p>
            <select
              className="h-10 rounded-xl border border-border bg-surface-strong px-2 text-xs text-foreground"
              value={`${sortBy}:${order}`}
              onChange={(event) => {
                const [nextSort, nextOrder] = event.target.value.split(":");
                setSortBy(nextSort);
                setOrder(nextOrder);
              }}
              aria-label="Sort transaction history"
            >
              <option value="profit_loss:desc">Highest P/L</option>
              <option value="profit_loss:asc">Lowest P/L</option>
              <option value="created_on:desc">Newest first</option>
              <option value="created_on:asc">Oldest first</option>
            </select>
          </div>
          {!overview?.transactions.length && (
            <p className="text-sm text-muted">Your buy and sell records will appear here.</p>
          )}
          {overview?.transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <div>
                <p className="text-sm font-medium">
                  {transaction.type === "BUY" ? "Bought" : "Sold"} {transaction.quantity} {transaction.unit}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(transaction.created_on)} · {formatUsd(transaction.unit_price_per_damlung)} / damlung
                </p>
              </div>
              <p className={`shrink-0 text-sm font-semibold ${profitClass(transaction.profit_loss)}`}>
                {formatUsd(transaction.profit_loss)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Telegram price alerts</CardTitle>
          <CardDescription>Get a Telegram message when the stored price crosses your target.</CardDescription>
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
              aria-label="Alert target USD per damlung"
              placeholder="USD / damlung"
              value={alertTarget}
              onChange={(event) => setAlertTarget(event.target.value)}
            />
            <select
              className="h-12 rounded-xl border border-border bg-surface-strong px-3 text-sm text-foreground"
              value={alertDirection}
              onChange={(event) => setAlertDirection(event.target.value as GoldDirection)}
              aria-label="Alert direction"
            >
              <option value="ABOVE">At or above</option>
              <option value="BELOW">At or below</option>
            </select>
            <Button disabled={isPending} type="submit">
              <Bell aria-hidden="true" size={15} /> Set alert
            </Button>
          </form>
          {alertsQuery.data?.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <div>
                <p className="text-sm font-medium">
                  {alert.direction === "ABOVE" ? "At or above" : "At or below"} {formatUsd(alert.target_price_per_damlung)}
                </p>
                <p className="text-xs text-muted">
                  {alert.triggered_on ? `Triggered ${formatDate(alert.triggered_on)}` : "Waiting for price update"}
                </p>
              </div>
              <Button
                aria-label="Delete price alert"
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
