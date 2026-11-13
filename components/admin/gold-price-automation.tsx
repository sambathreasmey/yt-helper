"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Coins, Save, TrendingUp } from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { formatUtcTimestamp } from "@/lib/date-format";
import { useGlobalAppSettings } from "@/hooks/use-global-app-settings";
import {
  getAdminGoldPrice,
  GLOBAL_APP_SETTINGS_QUERY_KEY,
  updateGlobalAppSettings,
} from "@/services/dashboard-api";

export function formatPrice(value: string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
    : value;
}

/** Shared by the dashboard tile and the sheet (same query key, so one request). */
export function useAdminGoldPriceQuery() {
  return useQuery({
    queryKey: ["admin", "gold-price"],
    queryFn: async () => {
      const result = await getAdminGoldPrice();
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    refetchInterval: 60_000,
  });
}

function GoldPriceForm({ onSaved }: { onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const globalSettingsQuery = useGlobalAppSettings();
  const priceQuery = useAdminGoldPriceQuery();
  const [enabled, setEnabled] = useState(globalSettingsQuery.data?.github_gold_price_updates_enabled ?? false);
  const saveMutation = useMutation({
    mutationFn: async (value: boolean) => {
      const current = globalSettingsQuery.data;
      if (!current) throw new Error("Global app settings are not loaded");
      const result = await updateGlobalAppSettings({ ...current, github_gold_price_updates_enabled: value });
      if (!result.ok || !result.data) {
        throw new Error(result.message || "Unable to update GitHub price-feed setting");
      }
      return result.data;
    },
    onSuccess: async (settings) => {
      queryClient.setQueryData(GLOBAL_APP_SETTINGS_QUERY_KEY, settings);
      await queryClient.invalidateQueries({ queryKey: GLOBAL_APP_SETTINGS_QUERY_KEY });
      onSaved("Price feed setting saved.");
    },
  });

  useEffect(() => {
    if (globalSettingsQuery.data) setEnabled(globalSettingsQuery.data.github_gold_price_updates_enabled);
  }, [globalSettingsQuery.data]);

  return (
    <div className="space-y-3">
      <div className="admin-current-price">
        <span className="admin-price-stat-icon" aria-hidden="true"><TrendingUp size={19} /></span>
        <p className="min-w-0 flex-1 text-sm text-muted">
          {priceQuery.isPending
            ? "Loading current price…"
            : priceQuery.data
              ? `Current: ${formatPrice(priceQuery.data.price_per_damlung)} / damlung · updated ${formatUtcTimestamp(priceQuery.data.updated_on)} · source ${priceQuery.data.source}`
              : "No gold price has been set."}
        </p>
      </div>
      {priceQuery.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{priceQuery.error.message}</p>}
      <label className="admin-global-toggle">
        <input
          checked={enabled}
          disabled={globalSettingsQuery.isPending || globalSettingsQuery.isError}
          onChange={(event) => setEnabled(event.target.checked)}
          type="checkbox"
        />
        <span>Allow GitHub Actions to update the gold price every 15 - 20 seconds</span>
      </label>
      <p className="text-xs text-muted">
        Turning this off makes scheduled runs skip price updates. Manual price entry is disabled in this dashboard.
      </p>
      {globalSettingsQuery.error && (
        <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{globalSettingsQuery.error.message}</p>
      )}
      <Button
        className="w-full"
        disabled={saveMutation.isPending || globalSettingsQuery.isPending || globalSettingsQuery.isError ||
          enabled === globalSettingsQuery.data?.github_gold_price_updates_enabled}
        onClick={() => saveMutation.mutate(enabled)}
        type="button"
        variant="primary"
      >
        <Save aria-hidden="true" size={16} />
        {saveMutation.isPending ? "Saving…" : "Save price feed setting"}
      </Button>
      {saveMutation.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{saveMutation.error.message}</p>}
    </div>
  );
}

export function GoldPriceSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (message: string) => void }) {
  return (
    <BottomSheet
      description="Check the current market price and control scheduled GitHub Action updates."
      icon={<Coins size={17} />}
      onClose={onClose}
      open={open}
      title="Gold price feed"
    >
      <GoldPriceForm onSaved={onSaved} />
    </BottomSheet>
  );
}
