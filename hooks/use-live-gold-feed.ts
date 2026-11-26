"use client";

import { useEffect, useState } from "react";
import { LiveGoldFeed, type FeedState } from "@/lib/live-gold-feed";
import { updateGoldPriceFromLiveFeed } from "@/services/dashboard-api";
import { useGlobalAppSettings } from "@/hooks/use-global-app-settings";

const FRONTEND_PRICE_UPDATE_INTERVAL_MS = 15_000;
const FRONTEND_PRICE_UPDATE_KEY = "helper-live-gold-price-update";
let lastPriceUpdateRequestAt = 0;

function isPriceUpdateDue() {
  let lastStoredAt = 0;
  try {
    lastStoredAt = Number(window.localStorage.getItem(FRONTEND_PRICE_UPDATE_KEY)) || 0;
  } catch {
    // The in-memory throttle still protects this tab when storage is unavailable.
  }
  return Date.now() - Math.max(lastPriceUpdateRequestAt, lastStoredAt) >= FRONTEND_PRICE_UPDATE_INTERVAL_MS;
}

function claimPriceUpdateLocally() {
  if (!isPriceUpdateDue()) return false;
  const now = Date.now();
  lastPriceUpdateRequestAt = now;
  try {
    window.localStorage.setItem(FRONTEND_PRICE_UPDATE_KEY, String(now));
  } catch {
    // The backend's shared database gate remains authoritative across clients.
  }
  return true;
}

async function postClaimedPrice(price: number) {
  const result = await updateGoldPriceFromLiveFeed(price);
  if (!result.ok) console.error("Could not sync the live gold price to the backend:", result.message);
}

async function syncLivePriceAcrossTabs(price: number) {
  if (!isPriceUpdateDue()) return;
  if (navigator.locks) {
    let claimed = false;
    await navigator.locks.request(
      "helper-live-gold-price-update",
      { ifAvailable: true },
      (lock) => {
        if (lock) claimed = claimPriceUpdateLocally();
      },
    );
    if (claimed) await postClaimedPrice(price);
    return;
  }
  if (claimPriceUpdateLocally()) await postClaimedPrice(price);
}

/** Live gold price (USD per damlung) straight from the market feed while `enabled` is true. */
export function useLiveGoldFeed(enabled: boolean, throttleMs = 250): FeedState {
  const [state, setState] = useState<FeedState>({ status: "connecting", price: null, updatedAt: null });
  const settings = useGlobalAppSettings();

  useEffect(() => {
    if (!enabled) {
      setState({ status: "connecting", price: null, updatedAt: null });
      return undefined;
    }
    const feed = new LiveGoldFeed(setState, { throttleMs });
    feed.start();
    return () => feed.stop();
  }, [enabled, throttleMs]);

  useEffect(() => {
    if (
      state.status !== "live" ||
      state.price === null ||
      !settings.data?.frontend_gold_price_updates_enabled ||
      settings.data.github_gold_price_updates_enabled
    ) return;
    void syncLivePriceAcrossTabs(state.price).catch((error: unknown) => {
      console.error("Could not coordinate a live gold price sync:", error);
    });
  }, [
    settings.data?.frontend_gold_price_updates_enabled,
    settings.data?.github_gold_price_updates_enabled,
    state.price,
    state.status,
    state.updatedAt,
  ]);

  return state;
}
