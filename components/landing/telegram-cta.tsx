"use client";

import { ArrowRight, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/providers/language-provider";
import { cn } from "@/lib/utils";

export const BOT_LINK = process.env.NEXT_PUBLIC_TELEGRAM_BOT_LINK || "https://t.me/homerestassistantbot?startapp";

interface TelegramCtaProps {
  id?: string;
  size?: "md" | "lg";
  className?: string;
  /** Shows the small "tap to launch" hint under the button. */
  hint?: boolean;
}

/** The one primary action on the page: open the Mini App in Telegram. */
export function TelegramCta({ id, size = "lg", className, hint = false }: TelegramCtaProps) {
  const { t } = useLanguage();
  return (
    <div className={cn("landing-cta-wrap", className)} id={id}>
      <a
        className={cn("landing-cta group", size === "md" && "landing-cta-md")}
        href={BOT_LINK}
        rel="noreferrer"
        target="_blank"
      >
        <Send aria-hidden="true" className="shrink-0" fill="currentColor" size={size === "md" ? 16 : 20} />
        <span>{t("openInTelegram")}</span>
        <ArrowRight aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-1" size={size === "md" ? 15 : 19} />
      </a>
      {hint && <p className="mt-2 text-xs text-muted">{t("openTelegramHint")}</p>}
    </div>
  );
}

/** Mobile-only bar that appears once the main buttons have scrolled out of view. */
export function StickyTelegramCta({ watchIds }: { watchIds: string[] }) {
  const { t } = useLanguage();
  return <StickyInner label={t("openInTelegram")} watchIds={watchIds} />;
}


function StickyInner({ label, watchIds }: { label: string; watchIds: string[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return undefined;
    const seen = new Map<string, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) seen.set((entry.target as HTMLElement).id, entry.isIntersecting);
      const anyVisible = watchIds.some((id) => seen.get(id));
      const passedHero = window.scrollY > 200;
      setVisible(!anyVisible && passedHero);
    });
    for (const id of watchIds) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [watchIds]);

  return (
    <div aria-hidden={!visible} className="landing-sticky-cta" data-visible={visible ? "true" : "false"}>
      <a className="landing-cta landing-cta-md" href={BOT_LINK} rel="noreferrer" tabIndex={visible ? 0 : -1} target="_blank">
        <Send aria-hidden="true" fill="currentColor" size={16} />
        <span>{label}</span>
        <ArrowRight aria-hidden="true" size={15} />
      </a>
    </div>
  );
}
