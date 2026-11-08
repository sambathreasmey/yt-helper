"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeScreenDemo } from "@/components/home-screen-demo";
import { useLanguage } from "@/providers/language-provider";
import { cn } from "@/lib/utils";

export function WelcomeVideoGuide() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto mt-4 max-w-sm">
      <Button
        aria-controls="welcome-video-guide"
        aria-expanded={open}
        className="w-full"
        onClick={() => setOpen((value) => !value)}
        variant="outline"
      >
        <Play aria-hidden="true" className="fill-current" size={17} />
        <span>{open ? t("homeGuideHide") : t("homeGuideTitle")}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn("transition-transform", open && "rotate-180")}
          size={18}
        />
      </Button>
      <p className="mt-2 text-xs text-muted">{t("homeGuideHint")}</p>
      {open && (
        <div className="mt-3" id="welcome-video-guide">
          <HomeScreenDemo ariaLabel={t("homeGuideHint")} />
        </div>
      )}
    </div>
  );
}
