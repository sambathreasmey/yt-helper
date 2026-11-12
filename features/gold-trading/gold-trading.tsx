"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ChartNoAxesCombined, ChevronRight, Coins, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppHeader } from "@/components/app-header";
import { GoldLivePrice, usePriceHistory } from "@/components/gold-live-price";
import { GoldHoldingsSkeleton, GoldSummarySkeleton } from "@/components/gold-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTelegram } from "@/hooks/use-telegram";
import { formatUtcTimestamp } from "@/lib/date-format";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/language-provider";
import { useTheme } from "@/providers/theme-provider";
import { impactTelegram } from "@/services/telegram-client";
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
} from "@/services/gold-trading-api";
import {
  formatProfit,
  formatQuantity,
  formatShortDate,
  formatUsd,
  pricePerUnit,
  profitClass,
  unitLabelKey,
} from "@/features/gold-trading/gold-format";
import { GoldSummary } from "@/features/gold-trading/gold-summary";
import {
  AlertsSheet,
  HoldingSheet,
  PurchaseSheet,
  SellSheet,
} from "@/features/gold-trading/gold-sheets";

type SheetKind = "buy" | "edit" | "sell" | "holding" | "alerts";
type Tab = "holdings" | "history";

const TOAST_MS = 3400;

export function GoldTrading() {
  const { telegram } = useTelegram();
  const { t, locale } = useLanguage();
  const { appearance } = useTheme();
  const initData = telegram?.initData || "";
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState("profit_loss");
  const [order, setOrder] = useState("desc");
  const [tab, setTab] = useState<Tab>("holdings");
  // `sheet` keeps its last value after closing so the sheet can finish its exit animation with the same content.
  const [sheet, setSheet] = useState<{ kind: SheetKind; id: number | null }>({ kind: "buy", id: null });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [fabVisible, setFabVisible] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  const refreshMs = appearance.refreshInterval * 1000;
  const overviewQuery = useQuery({
    queryKey: ["gold-overview", initData, sortBy, order],
    queryFn: () => getGoldOverview(initData, sortBy, order),
    enabled: Boolean(initData),
    // Keep the old numbers on screen while a new sort order loads, so the page never flashes empty.
    placeholderData: keepPreviousData,
    refetchInterval: refreshMs > 0 ? refreshMs : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
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
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const savePurchase = useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: GoldTradeInput }) =>
      id ? updateGoldPurchase(initData, id, input) : createGoldPurchase(initData, input),
    onSuccess: async (result) => {
      const alerted = "telegram_alert_sent" in result ? result.telegram_alert_sent : true;
      setNotice(alerted ? t("purchaseSaved") : t("purchaseSavedNoAlert"));
      closeSheet();
      await invalidateGoldData();
    },
  });
  const removePurchase = useMutation({
    mutationFn: (id: number) => deleteGoldPurchase(initData, id),
    onSuccess: async () => {
      setNotice(t("purchaseDeleted"));
      closeSheet();
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
      closeSheet();
      await invalidateGoldData();
    },
  });
  const saveAlert = useMutation({
    mutationFn: ({ target, direction }: { target: string; direction: GoldDirection }) =>
      createGoldPriceAlert(initData, target, direction),
    onSuccess: async () => {
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

  const openSheet = useCallback((kind: SheetKind, id: number | null = null) => {
    savePurchase.reset();
    removePurchase.reset();
    sellPurchase.reset();
    saveAlert.reset();
    removeAlert.reset();
    setSheet({ kind, id });
    setSheetOpen(true);
  // The mutation objects are stable for the component's lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overview = overviewQuery.data;
  const summary = overview?.summary;
  const holdings = overview?.holdings;
  const focusedHolding = holdings?.find((holding) => holding.id === sheet.id) ?? null;
  const livePrice = overview?.current_price ? Number(overview.current_price.price_per_damlung) : null;
  const priceHistory = usePriceHistory(livePrice, overviewQuery.dataUpdatedAt);
  const animatePrice = appearance.priceAnimation && appearance.motion;
  const formatMoney = useCallback((value: number) => formatUsd(String(value), locale), [locale]);
  const formatPerDamlung = useCallback(
    (value: number) => `${formatUsd(String(value), locale)} / ${t("damlungUnit")}`,
    [locale, t],
  );

  // Soft haptic when the live price moves.
  const lastPrice = useRef<number | null>(null);
  const { haptics } = appearance;
  useEffect(() => {
    if (livePrice === null) return;
    if (lastPrice.current !== null && lastPrice.current !== livePrice && haptics) impactTelegram(telegram, "soft");
    lastPrice.current = livePrice;
  }, [haptics, livePrice, telegram]);

  // Toast: auto-dismiss.
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Show a floating "+" shortcut once the action buttons have scrolled out of view.
  useEffect(() => {
    const element = actionsRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setFabVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [overviewQuery.isPending]);

  const pendingAny = savePurchase.isPending || removePurchase.isPending || sellPurchase.isPending
    || saveAlert.isPending || removeAlert.isPending;
  const activeAlerts = alertsQuery.data?.filter((alert) => !alert.triggered_on).length ?? 0;
  const onSortChange = (value: string) => {
    const [nextSort, nextOrder] = value.split(":");
    setSortBy(nextSort);
    setOrder(nextOrder);
  };

  return (
    <main className="gold-dashboard mx-auto w-full max-w-[520px] space-y-4">
      <AppHeader title={t("goldTrading")} subtitle={t("goldSubtitle")} brandIcon={ChartNoAxesCombined} brandVariant="gold" />

      <Card className="gold-price-hero">
        <div className="gold-price-content">
          <span className="gold-price-icon" aria-hidden="true">
            <Coins size={24} strokeWidth={2.1} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white/75">{t("goldPrice")}</p>
            {overviewQuery.isPending ? (
              <div className="mt-1.5 space-y-2">
                <Skeleton className="h-7 w-48 rounded-full bg-white/15" />
                <Skeleton className="h-2.5 w-32 rounded-full bg-white/15" />
              </div>
            ) : livePrice !== null ? (
              <GoldLivePrice
                animate={animatePrice}
                fetching={overviewQuery.isFetching}
                formatDelta={formatMoney}
                formatPrice={formatPerDamlung}
                history={priceHistory}
                intervalSeconds={appearance.refreshInterval}
                price={livePrice}
                priceUpdatedAt={overviewQuery.dataUpdatedAt}
              />
            ) : (
              <p className="gold-price-amount">{t("priceUnavailable")}</p>
            )}
            {!overviewQuery.isPending && !overview?.current_price && (
              <p className="mt-1 text-xs text-white/70">{t("adminMustSetPrice")}</p>
            )}
            {overview?.current_price && (
              <p className="gold-price-updated">
                {t("updated", { date: formatUtcTimestamp(overview.current_price.updated_on, locale) })}
              </p>
            )}
          </div>
          <ChartNoAxesCombined className="gold-price-decoration" aria-hidden="true" />
        </div>
      </Card>

      {overviewQuery.isPending && <GoldSummarySkeleton />}
      {summary && <GoldSummary animate={animatePrice} summary={summary} />}

      <div className="gold-actions" ref={actionsRef}>
        <Button className="gold-primary-action" onClick={() => openSheet("buy")} type="button" variant="primary">
          <Plus aria-hidden="true" size={18} /> {t("quickBuy")}
        </Button>
        <Button className="gold-alert-button" onClick={() => openSheet("alerts")} type="button">
          <Bell aria-hidden="true" size={17} /> {t("quickAlert")}
          {activeAlerts > 0 && <span className="gold-badge">{activeAlerts}</span>}
        </Button>
      </div>

      {overviewQuery.error && (
        <p className="status-error rounded-xl px-4 py-3 text-sm" role="alert">{overviewQuery.error.message}</p>
      )}
      {alertsQuery.error && (
        <p className="status-error rounded-xl px-4 py-3 text-sm" role="alert">{alertsQuery.error.message}</p>
      )}

      <Card className="gold-list-card">
        <div className="gold-list-head">
          <div className="gold-tabs" role="tablist">
            {(["holdings", "history"] as const).map((id) => (
              <button
                aria-selected={tab === id}
                className="gold-tab"
                key={id}
                onClick={() => setTab(id)}
                role="tab"
                type="button"
              >
                {id === "holdings" ? t("tabHoldings") : t("tabHistory")}
                {overview && (
                  <span className="gold-tab-count">
                    {id === "holdings" ? overview.holdings.length : overview.transactions.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <select
            aria-label={t(tab === "holdings" ? "sortHoldings" : "sortTransactions")}
            className="gold-sort-select"
            onChange={(event) => onSortChange(event.target.value)}
            value={`${sortBy}:${order}`}
          >
            <option value="profit_loss:desc">{t(tab === "holdings" ? "bestPL" : "highestPL")}</option>
            <option value="profit_loss:asc">{t(tab === "holdings" ? "worstPL" : "lowestPL")}</option>
            <option value="created_on:desc">{t("newestFirst")}</option>
            <option value="created_on:asc">{t("oldestFirst")}</option>
          </select>
        </div>

        <div className="gold-list-body" role="tabpanel">
          {overviewQuery.isPending && <GoldHoldingsSkeleton />}

          {tab === "holdings" && overview && (
            <>
              {overview.holdings.length === 0 && (
                <p className="gold-empty-state text-sm text-muted">{t("noPurchases")}</p>
              )}
              {overview.holdings.map((holding) => {
                const unit = t(unitLabelKey(holding.unit));
                const returnPercent = holding.profit_loss === null
                  ? null
                  : (Number(holding.profit_loss) / Number(holding.total_cost)) * 100;
                return (
                  <button
                    className="gold-holding-row"
                    key={holding.id}
                    onClick={() => openSheet("holding", holding.id)}
                    type="button"
                  >
                    <span aria-hidden="true" className="gold-row-badge">#{holding.id}</span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-semibold">
                        {formatQuantity(holding.remaining_quantity, locale)} {unit}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {formatShortDate(holding.created_on, locale)} · {formatUsd(pricePerUnit(holding.unit_price_per_damlung, holding.unit), locale)} / {unit}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className={cn("block text-sm font-bold tabular-nums", profitClass(holding.profit_loss))}>
                        {formatProfit(holding.profit_loss, locale)}
                      </span>
                      <span className="block text-[11px] tabular-nums text-muted">
                        {returnPercent === null
                          ? "—"
                          : `${returnPercent > 0 ? "+" : ""}${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(returnPercent)}%`}
                      </span>
                    </span>
                    <ChevronRight aria-hidden="true" className="shrink-0 text-muted" size={16} />
                  </button>
                );
              })}
            </>
          )}

          {tab === "history" && overview && (
            <>
              {overview.transactions.length === 0 && (
                <p className="gold-empty-state text-sm text-muted">{t("historyEmpty")}</p>
              )}
              {overview.transactions.map((transaction) => {
                const unit = t(unitLabelKey(transaction.unit));
                return (
                  <div key={transaction.id} className="gold-transaction-row flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span className="gold-transaction-type" data-type={transaction.type}>
                          {transaction.type === "BUY" ? t("bought") : t("sold")}
                        </span>
                        {transaction.quantity} {unit}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {formatShortDate(transaction.created_on, locale)} · {formatUsd(pricePerUnit(transaction.unit_price_per_damlung, transaction.unit), locale)} / {unit}
                      </p>
                    </div>
                    <p
                      className={cn("gold-transaction-result shrink-0 text-sm font-semibold", profitClass(transaction.profit_loss))}
                      data-result={transaction.profit_loss === null ? "neutral" : Number(transaction.profit_loss) < 0 ? "loss" : "profit"}
                    >
                      {formatUsd(transaction.profit_loss, locale)}
                    </p>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </Card>

      <button
        aria-label={t("quickBuy")}
        className="gold-fab"
        data-visible={fabVisible && !sheetOpen ? "true" : "false"}
        onClick={() => openSheet("buy")}
        tabIndex={fabVisible && !sheetOpen ? 0 : -1}
        type="button"
      >
        <Plus aria-hidden="true" size={24} strokeWidth={2.4} />
      </button>

      <PurchaseSheet
        error={savePurchase.error?.message}
        holding={sheet.kind === "edit" ? focusedHolding : null}
        onClose={closeSheet}
        onSubmit={(input) => savePurchase.mutate({ id: sheet.kind === "edit" ? sheet.id : null, input })}
        open={sheetOpen && (sheet.kind === "buy" || sheet.kind === "edit")}
        pending={savePurchase.isPending}
      />
      <HoldingSheet
        error={removePurchase.error?.message}
        holding={focusedHolding}
        onClose={closeSheet}
        onDelete={() => {
          if (focusedHolding && window.confirm(t("deletePurchaseConfirm"))) removePurchase.mutate(focusedHolding.id);
        }}
        onEdit={() => focusedHolding && openSheet("edit", focusedHolding.id)}
        onSell={() => focusedHolding && openSheet("sell", focusedHolding.id)}
        open={sheetOpen && sheet.kind === "holding"}
        pending={pendingAny}
      />
      <SellSheet
        currentPricePerDamlung={overview?.current_price?.price_per_damlung ?? null}
        error={sellPurchase.error?.message}
        holding={focusedHolding}
        onClose={closeSheet}
        onSubmit={(unitPrice) => focusedHolding && sellPurchase.mutate({ id: focusedHolding.id, unitPrice })}
        open={sheetOpen && sheet.kind === "sell"}
        pending={sellPurchase.isPending}
      />
      <AlertsSheet
        alerts={alertsQuery.data}
        error={(saveAlert.error || removeAlert.error)?.message}
        loading={alertsQuery.isPending && alertsQuery.fetchStatus !== "idle"}
        onClose={closeSheet}
        onCreate={async (target, direction) => {
          try {
            await saveAlert.mutateAsync({ target, direction });
            return true;
          } catch {
            return false;
          }
        }}
        onDelete={(id) => removeAlert.mutate(id)}
        open={sheetOpen && sheet.kind === "alerts"}
        pending={saveAlert.isPending || removeAlert.isPending}
      />

      {typeof document !== "undefined" && createPortal(
        <div aria-live="polite" className="app-toast" data-visible={notice ? "true" : "false"} role="status">
          {notice}
        </div>,
        document.body,
      )}
    </main>
  );
}
