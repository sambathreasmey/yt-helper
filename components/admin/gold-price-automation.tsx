"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Coins, RefreshCw, Save, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUtcTimestamp } from "@/lib/date-format";
import { useGlobalAppSettings } from "@/hooks/use-global-app-settings";
import {
  getAdminGoldPrice,
  GLOBAL_APP_SETTINGS_QUERY_KEY,
  updateGlobalAppSettings,
} from "@/services/dashboard-api";

function formatPrice(value: string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
    : value;
}

export function GoldPriceAutomation() {
  const queryClient = useQueryClient();
  const globalSettingsQuery = useGlobalAppSettings();
  const [enabled, setEnabled] = useState(false);
  const priceQuery = useQuery({
    queryKey: ["admin", "gold-price"],
    queryFn: async () => {
      const result = await getAdminGoldPrice();
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    refetchInterval: 60_000,
  });
  const saveMutation = useMutation({
    mutationFn: async (value: boolean) => {
      const current = globalSettingsQuery.data;
      if (!current) throw new Error("Global app settings are not loaded");
      const result = await updateGlobalAppSettings({
        ...current,
        github_gold_price_updates_enabled: value,
      });
      if (!result.ok || !result.data) {
        throw new Error(result.message || "Unable to update GitHub price-feed setting");
      }
      return result.data;
    },
    onSuccess: async (settings) => {
      queryClient.setQueryData(GLOBAL_APP_SETTINGS_QUERY_KEY, settings);
      await queryClient.invalidateQueries({ queryKey: GLOBAL_APP_SETTINGS_QUERY_KEY });
    },
  });

  useEffect(() => {
    if (globalSettingsQuery.data) {
      setEnabled(globalSettingsQuery.data.github_gold_price_updates_enabled);
    }
  }, [globalSettingsQuery.data]);

  return (
    <Card className="admin-price-card">
      <CardHeader>
        <div className="admin-section-heading">
          <span className="admin-heading-icon admin-heading-gold" aria-hidden="true"><Coins size={18} /></span>
          <div>
            <CardTitle>Gold price feed</CardTitle>
            <CardDescription>Check the current market price and control scheduled GitHub Action updates.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="admin-current-price">
          <span className="admin-price-stat-icon" aria-hidden="true"><TrendingUp size={19} /></span>
          <p className="min-w-0 flex-1 text-sm text-muted">
            {priceQuery.isPending
              ? "Loading current price…"
              : priceQuery.data
                ? `Current: ${formatPrice(priceQuery.data.price_per_damlung)} / damlung · updated ${formatUtcTimestamp(priceQuery.data.updated_on)} · source ${priceQuery.data.source}`
                : "No gold price has been set."}
          </p>
          {priceQuery.data && <RefreshCw aria-hidden="true" className="shrink-0 text-muted" size={17} />}
        </div>
        {priceQuery.error && (
          <p role="alert" className="text-sm text-rose-400">{priceQuery.error.message}</p>
        )}
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
          <p role="alert" className="text-sm text-rose-400">{globalSettingsQuery.error.message}</p>
        )}
        <Button
          className="admin-price-submit"
          disabled={saveMutation.isPending || globalSettingsQuery.isPending || globalSettingsQuery.isError ||
            enabled === globalSettingsQuery.data?.github_gold_price_updates_enabled}
          onClick={() => saveMutation.mutate(enabled)}
          type="button"
          variant="primary"
        >
          <Save aria-hidden="true" size={16} />
          {saveMutation.isPending ? "Saving…" : "Save price feed setting"}
        </Button>
        {saveMutation.error && (
          <p role="alert" className="text-sm text-rose-400">{saveMutation.error.message}</p>
        )}
        {saveMutation.isSuccess && (
          <p role="status" className="text-sm text-emerald-400">Price feed setting saved.</p>
        )}
      </CardContent>
    </Card>
  );
}
