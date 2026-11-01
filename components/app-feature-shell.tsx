"use client";

import { useState } from "react";
import { GoldTrading } from "@/features/gold-trading/gold-trading";
import { YouTubeHelper } from "@/features/youtube-helper/youtube-helper";
import { useLanguage } from "@/providers/language-provider";

type AppFeature = "youtube" | "gold";

export function AppFeatureShell() {
  const [feature, setFeature] = useState<AppFeature>("youtube");
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <nav className="glass mb-4 flex items-center gap-2 rounded-[24px] p-1.5" aria-label={t("featureNavigation")}>
        <button
          className={`min-h-10 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors ${
            feature === "youtube" ? "bg-accent-soft text-foreground" : "text-muted"
          }`}
          onClick={() => setFeature("youtube")}
          type="button"
          aria-current={feature === "youtube" ? "page" : undefined}
        >
          {t("youtube")}
        </button>
        <button
          className={`min-h-10 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors ${
            feature === "gold" ? "bg-accent-soft text-foreground" : "text-muted"
          }`}
          onClick={() => setFeature("gold")}
          type="button"
          aria-current={feature === "gold" ? "page" : undefined}
        >
          {t("goldTrading")}
        </button>
      </nav>
      {feature === "gold" ? <GoldTrading /> : <YouTubeHelper />}
    </div>
  );
}
