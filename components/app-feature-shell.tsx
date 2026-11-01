"use client";

import { useState } from "react";
import { GoldTrading } from "@/features/gold-trading/gold-trading";
import { YouTubeHelper } from "@/features/youtube-helper/youtube-helper";

type AppFeature = "youtube" | "gold";

export function AppFeatureShell() {
  const [feature, setFeature] = useState<AppFeature>("youtube");

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <nav className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-1.5" aria-label="Mini App features">
        <button
          className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition-colors ${
            feature === "youtube" ? "bg-accent-soft text-foreground" : "text-muted"
          }`}
          onClick={() => setFeature("youtube")}
          type="button"
          aria-current={feature === "youtube" ? "page" : undefined}
        >
          YouTube
        </button>
        <button
          className={`min-h-10 rounded-xl px-3 text-sm font-semibold transition-colors ${
            feature === "gold" ? "bg-accent-soft text-foreground" : "text-muted"
          }`}
          onClick={() => setFeature("gold")}
          type="button"
          aria-current={feature === "gold" ? "page" : undefined}
        >
          Gold trading
        </button>
      </nav>
      {feature === "gold" ? <GoldTrading /> : <YouTubeHelper />}
    </div>
  );
}
