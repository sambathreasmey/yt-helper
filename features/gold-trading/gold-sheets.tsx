"use client";

import { ArrowDownToLine, ArrowUpFromLine, Bell, Coins, FileText, Pencil, Trash2, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/providers/language-provider";
import type {
  GoldDirection,
  GoldHolding,
  GoldPriceAlert,
  GoldTradeInput,
  GoldUnit,
} from "@/services/gold-trading-api";
import {
  formatDate,
  formatProfit,
  formatQuantity,
  formatShortDate,
  formatUsd,
  pricePerUnit,
  profitClass,
  unitLabelKey,
  units,
} from "@/features/gold-trading/gold-format";

function SheetError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{message}</p>;
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

/* ------------------------------------------------------------------ Purchase (add / edit) */

function PurchaseForm({
  holding,
  pending,
  error,
  onSubmit,
}: {
  holding: GoldHolding | null;
  pending: boolean;
  error?: string;
  onSubmit: (input: GoldTradeInput) => void;
}) {
  const { t } = useLanguage();
  const [unit, setUnit] = useState<GoldUnit>(holding?.unit ?? "chi");
  const [quantity, setQuantity] = useState(holding?.quantity ?? "");
  const [price, setPrice] = useState(holding ? pricePerUnit(holding.unit_price_per_damlung, holding.unit) : "");
  const [note, setNote] = useState(holding?.note ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ unit, quantity, unit_price: price, note });
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <TradeFields
        note={note}
        price={price}
        quantity={quantity}
        setNote={setNote}
        setPrice={setPrice}
        setQuantity={setQuantity}
        setUnit={setUnit}
        unit={unit}
      />
      <SheetError message={error} />
      <Button className="gold-primary-action w-full" disabled={pending} type="submit" variant="primary">
        <ArrowDownToLine aria-hidden="true" size={16} />
        {holding ? t("saveChanges") : t("addPurchase")}
      </Button>
    </form>
  );
}

export function PurchaseSheet({
  open,
  holding,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  holding: GoldHolding | null;
  pending: boolean;
  error?: string;
  onSubmit: (input: GoldTradeInput) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <BottomSheet
      description={t("unitConversions")}
      icon={<FileText size={17} />}
      onClose={onClose}
      open={open}
      title={holding ? t("editPurchase") : t("recordPurchase")}
    >
      <PurchaseForm error={error} holding={holding} onSubmit={onSubmit} pending={pending} />
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ Sell */

function SellForm({
  holding,
  currentPricePerDamlung,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  holding: GoldHolding;
  currentPricePerDamlung: string | null;
  pending: boolean;
  error?: string;
  onSubmit: (unitPrice: string) => void;
  onClose: () => void;
}) {
  const { t, locale } = useLanguage();
  const suggested = currentPricePerDamlung ? pricePerUnit(currentPricePerDamlung, holding.unit) : "";
  const [price, setPrice] = useState(suggested);
  const unitLabel = t(unitLabelKey(holding.unit));
  const remaining = `${formatQuantity(holding.remaining_quantity, locale)} ${unitLabel}`;

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(price);
      }}
    >
      <p className="text-sm font-medium">{t("sellRemaining", { quantity: remaining })}</p>
      <p className="text-xs text-muted">
        {t("sellPriceHint", {
          price: suggested ? `${formatUsd(suggested, locale)} / ${unitLabel}` : t("priceUnavailable"),
        })}
      </p>
      <label className="block space-y-1.5 text-xs text-muted">
        {t("salePricePerUnit", { unit: unitLabel })}
        <Input
          inputMode="decimal"
          min="0.000001"
          onChange={(event) => setPrice(event.target.value)}
          placeholder={t("unitPricePlaceholder", { unit: unitLabel })}
          required
          step="any"
          type="number"
          value={price}
        />
      </label>
      <SheetError message={error} />
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={pending} onClick={onClose} type="button" variant="outline">{t("cancel")}</Button>
        <Button disabled={pending} type="submit" variant="primary">{t("confirmSale")}</Button>
      </div>
    </form>
  );
}

export function SellSheet({
  open,
  holding,
  currentPricePerDamlung,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  holding: GoldHolding | null;
  currentPricePerDamlung: string | null;
  pending: boolean;
  error?: string;
  onSubmit: (unitPrice: string) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <BottomSheet
      icon={<ArrowUpFromLine size={17} />}
      onClose={onClose}
      open={open}
      title={`${t("sell")} · ${t("purchaseRecord")} #${holding?.id ?? ""}`}
    >
      {holding && (
        <SellForm
          currentPricePerDamlung={currentPricePerDamlung}
          error={error}
          holding={holding}
          onClose={onClose}
          onSubmit={onSubmit}
          pending={pending}
        />
      )}
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ Alerts */

function AlertsContent({
  alerts,
  loading,
  pending,
  error,
  onCreate,
  onDelete,
}: {
  alerts: GoldPriceAlert[] | undefined;
  loading: boolean;
  pending: boolean;
  error?: string;
  onCreate: (target: string, direction: GoldDirection) => Promise<boolean>;
  onDelete: (id: number) => void;
}) {
  const { t, locale } = useLanguage();
  const [target, setTarget] = useState("");
  const [direction, setDirection] = useState<GoldDirection>("ABOVE");

  return (
    <div className="space-y-3">
      <form
        className="gold-alert-form flex flex-wrap gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          if (await onCreate(target, direction)) setTarget("");
        }}
      >
        <span className="gold-alert-target">
          <span className="gold-field-icon gold-field-icon-cyan" aria-hidden="true"><Coins size={17} /></span>
          <Input
            aria-label={t("alertTarget")}
            inputMode="decimal"
            min="0.000001"
            onChange={(event) => setTarget(event.target.value)}
            placeholder={t("usdDamlungPlaceholder")}
            required
            step="any"
            type="number"
            value={target}
          />
        </span>
        <select
          aria-label={t("alertDirection")}
          className="gold-alert-direction h-12 rounded-xl border border-border bg-surface-strong px-3 text-sm text-foreground"
          onChange={(event) => setDirection(event.target.value as GoldDirection)}
          value={direction}
        >
          <option value="ABOVE">{t("atOrAbove")}</option>
          <option value="BELOW">{t("atOrBelow")}</option>
        </select>
        <Button className="gold-alert-submit" disabled={pending} type="submit">
          <Bell aria-hidden="true" size={15} /> {t("setAlert")}
        </Button>
      </form>
      <SheetError message={error} />
      {loading && <Skeleton className="h-14 w-full rounded-xl" />}
      {!loading && alerts?.length === 0 && <p className="gold-empty-state text-sm text-muted">{t("noAlerts")}</p>}
      {alerts?.map((alert) => (
        <div
          className="gold-alert-row flex items-center justify-between gap-3"
          data-status={alert.triggered_on ? "triggered" : "waiting"}
          key={alert.id}
        >
          <div className="min-w-0">
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
            disabled={pending}
            onClick={() => onDelete(alert.id)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" size={16} />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function AlertsSheet({
  open,
  alerts,
  loading,
  pending,
  error,
  onCreate,
  onDelete,
  onClose,
}: {
  open: boolean;
  alerts: GoldPriceAlert[] | undefined;
  loading: boolean;
  pending: boolean;
  error?: string;
  onCreate: (target: string, direction: GoldDirection) => Promise<boolean>;
  onDelete: (id: number) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <BottomSheet
      description={t("alertsDescription")}
      icon={<Bell size={17} />}
      onClose={onClose}
      open={open}
      title={t("priceAlerts")}
    >
      <AlertsContent
        alerts={alerts}
        error={error}
        loading={loading}
        onCreate={onCreate}
        onDelete={onDelete}
        pending={pending}
      />
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ Holding details */

function HoldingDetails({
  holding,
  pending,
  error,
  onSell,
  onEdit,
  onDelete,
}: {
  holding: GoldHolding;
  pending: boolean;
  error?: string;
  onSell: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t, locale } = useLanguage();
  const unitLabel = t(unitLabelKey(holding.unit));
  const returnPercent = holding.profit_loss === null
    ? null
    : (Number(holding.profit_loss) / Number(holding.total_cost)) * 100;

  return (
    <div className="space-y-3">
      <div
        className="gold-result-pill flex items-center justify-between gap-3 rounded-xl px-4 py-3"
        data-result={holding.profit_loss === null ? "neutral" : Number(holding.profit_loss) < 0 ? "loss" : "profit"}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide">
            {holding.profit_loss === null
              ? t("sortProfitLoss")
              : Number(holding.profit_loss) > 0 ? t("profit") : Number(holding.profit_loss) < 0 ? t("loss") : t("breakEven")}
          </p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">{formatProfit(holding.profit_loss, locale)}</p>
        </div>
        {returnPercent !== null && (
          <p className="text-sm font-semibold">
            {returnPercent > 0 ? "+" : ""}{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(returnPercent)}%
          </p>
        )}
      </div>

      <div className="gold-detail-grid grid grid-cols-2 gap-2">
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
          <p className="mt-0.5 text-sm font-semibold">{formatQuantity(holding.remaining_quantity, locale)} {unitLabel}</p>
        </div>
        <div className="gold-detail-item" data-tone="gold">
          <p className="text-[11px] text-muted">{t("currentValue")}</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums">{formatUsd(holding.market_value, locale)}</p>
        </div>
      </div>

      <div className="gold-purchase-meta flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-xs">
        <span className="text-muted">
          {t("boughtQuantity", { quantity: `${formatQuantity(holding.quantity, locale)} ${unitLabel}` })} · {formatShortDate(holding.created_on, locale)}
        </span>
        <span className="font-medium">
          {t("buyRate")} {formatUsd(pricePerUnit(holding.unit_price_per_damlung, holding.unit), locale)} / {unitLabel}
        </span>
      </div>
      {holding.note && <p className="gold-holding-note text-xs text-muted">{holding.note}</p>}
      {!holding.can_edit && <p className="text-xs text-muted">{t("partiallySoldCannotEdit")}</p>}
      <SheetError message={error} />

      <div className="grid grid-cols-3 gap-2">
        <button
          className="sheet-action sheet-action-sell"
          disabled={pending || !(Number(holding.remaining_hun) > 0)}
          onClick={onSell}
          type="button"
        >
          <ArrowUpFromLine aria-hidden="true" size={15} /> {t("sell")}
        </button>
        <button className="sheet-action" disabled={!holding.can_edit || pending} onClick={onEdit} type="button">
          <Pencil aria-hidden="true" size={15} /> {t("edit")}
        </button>
        <button
          className="sheet-action sheet-action-delete"
          disabled={!holding.can_edit || pending}
          onClick={onDelete}
          type="button"
        >
          <Trash2 aria-hidden="true" size={15} /> {t("delete")}
        </button>
      </div>
    </div>
  );
}

export function HoldingSheet({
  open,
  holding,
  pending,
  error,
  onSell,
  onEdit,
  onDelete,
  onClose,
}: {
  open: boolean;
  holding: GoldHolding | null;
  pending: boolean;
  error?: string;
  onSell: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  return (
    <BottomSheet
      icon={<Wallet size={17} />}
      onClose={onClose}
      open={open}
      title={`${t("purchaseRecord")} #${holding?.id ?? ""}`}
    >
      {holding && (
        <HoldingDetails
          error={error}
          holding={holding}
          onDelete={onDelete}
          onEdit={onEdit}
          onSell={onSell}
          pending={pending}
        />
      )}
    </BottomSheet>
  );
}
