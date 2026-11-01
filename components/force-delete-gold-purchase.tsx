"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/hooks/use-telegram";
import { formatUtcTimestamp } from "@/lib/date-format";
import { useLanguage } from "@/providers/language-provider";
import { forceDeleteGoldPurchase, getGoldOverview } from "@/services/gold-trading-api";

export function ForceDeleteGoldPurchase() {
  const { telegram } = useTelegram();
  const { t, locale } = useLanguage();
  const initData = telegram?.initData || "";
  const queryClient = useQueryClient();
  const [purchaseId, setPurchaseId] = useState("");
  const [reason, setReason] = useState("");

  const overviewQuery = useQuery({
    queryKey: ["gold-overview", initData, "force-delete"],
    queryFn: () => getGoldOverview(initData),
    enabled: Boolean(initData),
  });
  const deleteMutation = useMutation({
    mutationFn: ({ id, deletionReason }: { id: number; deletionReason: string }) =>
      forceDeleteGoldPurchase(initData, id, deletionReason),
    onSuccess: async () => {
      setPurchaseId("");
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["gold-overview", initData] });
    },
  });

  const soldHoldings = overviewQuery.data?.holdings.filter((holding) => !holding.can_edit) ?? [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(purchaseId);
    const deletionReason = reason.trim();
    if (!Number.isSafeInteger(id) || id <= 0 || !deletionReason) return;
    if (!window.confirm(t("forceDeleteWarning", { id }))) return;
    deleteMutation.mutate({ id, deletionReason });
  }

  return (
    <fieldset className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-3">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-rose-400">
        {t("forceDeleteTitle")}
      </legend>
      <div className="space-y-3">
        <p className="flex items-start gap-2 text-xs text-muted">
          <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-rose-400" size={15} />
          <span>{t("forceDeleteDescription")}</span>
        </p>

        {overviewQuery.isPending && (
          <p className="text-xs text-muted">{t("loadingPortfolio")}</p>
        )}
        {overviewQuery.error && (
          <p className="text-xs text-rose-400" role="alert">{overviewQuery.error.message}</p>
        )}
        {overviewQuery.data && soldHoldings.length === 0 && (
          <p className="text-xs text-muted">{t("forceDeleteNoRecords")}</p>
        )}

        {soldHoldings.length > 0 && (
          <form className="space-y-2.5" onSubmit={submit}>
            <label className="block space-y-1 text-xs text-muted">
              {t("purchaseRecord")}
              <select
                className="h-10 w-full rounded-xl border border-border bg-surface-strong px-2 text-xs text-foreground"
                onChange={(event) => setPurchaseId(event.target.value)}
                required
                value={purchaseId}
              >
                <option value="" disabled>{t("purchaseRecords")}</option>
                {soldHoldings.map((holding) => (
                  <option key={holding.id} value={holding.id}>
                    #{holding.id} · {formatUtcTimestamp(holding.created_on, locale)} ·{" "}
                    {holding.remaining_quantity} / {holding.quantity} {t(
                      holding.unit === "damlung"
                        ? "damlungUnit"
                        : holding.unit === "chi"
                          ? "chiUnit"
                          : "hunUnit",
                    )}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-xs text-muted">
              {t("forceDeleteReason")}
              <textarea
                className="min-h-16 w-full resize-y rounded-xl border border-border bg-surface-strong px-3 py-2 text-xs text-foreground placeholder:text-muted"
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("forceDeleteReasonPlaceholder")}
                required
                value={reason}
              />
            </label>

            {deleteMutation.error && (
              <p className="text-xs text-rose-400" role="alert">{deleteMutation.error.message}</p>
            )}
            {deleteMutation.isSuccess && (
              <p className="text-xs text-emerald-400" role="status">{t("forceDeleteSuccess")}</p>
            )}
            <Button
              className="w-full border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
              disabled={deleteMutation.isPending || !purchaseId || !reason.trim()}
              type="submit"
              variant="outline"
            >
              <Trash2 aria-hidden="true" size={14} />
              {deleteMutation.isPending ? t("loadingPortfolio") : t("forceDeleteAction")}
            </Button>
          </form>
        )}
      </div>
    </fieldset>
  );
}
