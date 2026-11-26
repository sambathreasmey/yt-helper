"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Save, TrendingUp } from "lucide-react";
import { GoldIcon } from "@/components/icons/gold-icon";
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
  const [enabled, setEnabled] = useState({
    github: globalSettingsQuery.data?.github_gold_price_updates_enabled ?? false,
    frontend: globalSettingsQuery.data?.frontend_gold_price_updates_enabled ?? true,
  });
  const saveMutation = useMutation({
    mutationFn: async (value: { github: boolean; frontend: boolean }) => {
      const current = globalSettingsQuery.data;
      if (!current) throw new Error("Global app settings are not loaded");
      const result = await updateGlobalAppSettings({
        ...current,
        github_gold_price_updates_enabled: value.github,
        frontend_gold_price_updates_enabled: value.frontend,
      });
      if (!result.ok || !result.data) {
        throw new Error(result.message || "Unable to update gold price-feed settings");
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
    if (globalSettingsQuery.data) {
      setEnabled({
        github: globalSettingsQuery.data.github_gold_price_updates_enabled,
        frontend: globalSettingsQuery.data.frontend_gold_price_updates_enabled,
      });
    }
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
          checked={enabled.frontend}
          disabled={globalSettingsQuery.isPending || globalSettingsQuery.isError}
          onChange={(event) => setEnabled((current) => ({
            frontend: event.target.checked,
            github: event.target.checked ? false : current.github,
          }))}
          type="checkbox"
        />
        <span>Sync the live WebSocket price to the app database every 15 seconds</span>
      </label>
      <label className="admin-global-toggle">
        <input
          checked={enabled.github}
          disabled={globalSettingsQuery.isPending || globalSettingsQuery.isError}
          onChange={(event) => setEnabled((current) => ({
            github: event.target.checked,
            frontend: event.target.checked ? false : current.frontend,
          }))}
          type="checkbox"
        />
        <span>Allow GitHub Actions to update the gold price every 15–20 seconds</span>
      </label>
      <p className="text-xs text-muted">
        Choose one update source. Frontend mode streams prices to the trading view and recalculates portfolio values locally, pausing overview polling while connected; the app&apos;s normal refresh setting applies if the feed drops. The backend shares a global 15-second lock across clients and GitHub runs, preventing duplicate database updates or alerts.
      </p>
      {globalSettingsQuery.error && (
        <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{globalSettingsQuery.error.message}</p>
      )}
      <Button
        className="w-full"
        disabled={saveMutation.isPending || globalSettingsQuery.isPending || globalSettingsQuery.isError ||
          (enabled.github === globalSettingsQuery.data?.github_gold_price_updates_enabled &&
            enabled.frontend === globalSettingsQuery.data?.frontend_gold_price_updates_enabled)}
        onClick={() => saveMutation.mutate(enabled)}
        type="button"
        variant="primary"
      >
        <Save aria-hidden="true" size={16} />
        {saveMutation.isPending ? "Saving…" : "Save price feed settings"}
      </Button>
      {saveMutation.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{saveMutation.error.message}</p>}
    </div>
  );
}

export function GoldPriceSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (message: string) => void }) {
  return (
    <BottomSheet
      description="Check the current market price and control live WebSocket or GitHub Action updates."
      icon={<GoldIcon size={17} />}
      onClose={onClose}
      open={open}
      title="Gold price feed"
    >
      <GoldPriceForm onSaved={onSaved} />
    </BottomSheet>
  );
}
