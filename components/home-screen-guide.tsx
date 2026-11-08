"use client";

import { useState } from "react";
import { ChevronDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeScreenDemo } from "@/components/home-screen-demo";
import { useLanguage } from "@/providers/language-provider";
import { cn } from "@/lib/utils";

/** Collapsible how-to video shown under the "Home Screen" tile. The video loads only when opened. */
export function HomeScreenGuide() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="col-span-2" data-action="home-guide">
      <Button
        aria-controls="home-screen-demo"
        aria-expanded={open}
        className="youtube-action-tile w-full"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="youtube-action-icon"><Play aria-hidden="true" size={21} /></span>
        <span className="youtube-action-label">{open ? t("homeGuideHide") : t("homeGuideTitle")}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn("youtube-action-chevron transition-transform", open && "rotate-180")}
          size={19}
        />
      </Button>
      {open ? (
        <div className="mt-3" id="home-screen-demo">
          <HomeScreenDemo />
        </div>
      ) : (
        <p className="mt-1.5 px-1 text-xs text-muted">{t("homeGuideHint")}</p>
      )}
    </div>
  );
}
