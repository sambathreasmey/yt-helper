"use client";

import { useEffect, useState } from "react";
import { LiveGoldFeed, type FeedState } from "@/lib/live-gold-feed";

/** Live gold price (USD per damlung) straight from the market feed while `enabled` is true. */
export function useLiveGoldFeed(enabled: boolean): FeedState {
  const [state, setState] = useState<FeedState>({ status: "connecting", price: null, updatedAt: null });

  useEffect(() => {
    if (!enabled) return undefined;
    const feed = new LiveGoldFeed(setState);
    feed.start();
    return () => feed.stop();
  }, [enabled]);

  return state;
}
