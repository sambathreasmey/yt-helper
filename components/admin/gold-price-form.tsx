"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ArrowUpRight, Coins, History, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatUtcTimestamp } from "@/lib/date-format";
import { getAdminGoldPrice, updateAdminGoldPrice } from "@/services/dashboard-api";

function formatPrice(value: string): string {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
    : value;
}

export function GoldPriceForm() {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const priceQuery = useQuery({
    queryKey: ["admin", "gold-price"],
    queryFn: async () => {
      const result = await getAdminGoldPrice();
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
  });
  const updateMutation = useMutation({
    mutationFn: async (value: string) => {
      const result = await updateAdminGoldPrice(value);
      if (!result.ok || !result.data) {
        throw new Error(result.message || "Gold price update failed");
      }
      return result.data;
    },
    onSuccess: async (result) => {
      setPrice("");
      setStatusMessage(
        result.notification_failures
          ? `Price updated. ${result.notification_failures} Telegram price alert(s) could not be sent.`
          : `Price updated${result.triggered_alerts
              ? `; ${result.triggered_alerts} Telegram price alert(s) sent`
              : ""}.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin", "gold-price"] });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage("");
    updateMutation.mutate(price);
  }

  return (
    <Card className="admin-price-card">
      <CardHeader>
        <div className="admin-section-heading">
          <span className="admin-heading-icon admin-heading-gold" aria-hidden="true"><Coins size={18} /></span>
          <div>
            <CardTitle>Gold price</CardTitle>
            <CardDescription>Set the shared gold price in USD per damlung.</CardDescription>
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
              ? `Current: ${formatPrice(priceQuery.data.price_per_damlung)} / damlung · updated ${formatUtcTimestamp(priceQuery.data.updated_on)}`
              : "No gold price has been set."}
          </p>
          {priceQuery.data && <History aria-hidden="true" className="shrink-0 text-muted" size={17} />}
        </div>
        {priceQuery.error && (
          <p role="alert" className="text-sm text-rose-400">{priceQuery.error.message}</p>
        )}
        <form className="admin-price-form flex flex-wrap gap-2" onSubmit={submit}>
          <Input
            required
            min="0.000001"
            step="0.000001"
            type="number"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="USD / damlung"
            aria-label="Gold price per damlung in USD"
          />
          <Button className="admin-price-submit" disabled={updateMutation.isPending || !price} type="submit" variant="primary">
            <ArrowUpRight aria-hidden="true" size={16} />
            {updateMutation.isPending ? "Updating…" : "Update price"}
          </Button>
        </form>
        {(statusMessage || updateMutation.error) && (
          <p
            role={updateMutation.error ? "alert" : "status"}
            className={`text-sm ${updateMutation.error ? "text-rose-400" : "text-muted"}`}
          >
            {updateMutation.error?.message || statusMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
