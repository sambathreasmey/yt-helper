"use client";

import { useEffect, useState } from "react";
import { CirclePlay, Coins } from "lucide-react";
import { GoldTrading } from "@/features/gold-trading/gold-trading";
import { YouTubeHelper } from "@/features/youtube-helper/youtube-helper";
import { useLanguage } from "@/providers/language-provider";

type AppFeature = "youtube" | "gold";

export function AppFeatureShell() {
  const [feature, setFeature] = useState<AppFeature>("youtube");
  const [switchDirection, setSwitchDirection] = useState<AppFeature | null>(null);
  const [navVisible, setNavVisible] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let previousScrollY = window.scrollY;
    let inputFocused = false;
    let scrollFrame = 0;
    let focusFrame = 0;

    const isTextEntry = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.matches("input, textarea, [contenteditable='true']"));

    const handleScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - previousScrollY;

        if (inputFocused) {
          setNavVisible(false);
        } else if (currentScrollY < 48) {
          setNavVisible(true);
        } else if (Math.abs(delta) >= 6) {
          setNavVisible(delta < 0);
        }

        previousScrollY = currentScrollY;
      });
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!isTextEntry(event.target)) return;
      inputFocused = true;
      setNavVisible(false);
    };

    const handleFocusOut = () => {
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
      focusFrame = window.requestAnimationFrame(() => {
        focusFrame = 0;
        inputFocused = isTextEntry(document.activeElement);
        if (!inputFocused) setNavVisible(true);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
    };
  }, []);

  const featureButtonClass =
    "feature-nav-button transition-all duration-200";
  const selectedFeatureStyle = {
    color: "var(--accent)",
  };

  function selectFeature(nextFeature: AppFeature) {
    if (nextFeature === feature) return;
    setSwitchDirection(nextFeature);
    setFeature(nextFeature);
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[520px] pb-24">
        <div className="feature-page-enter" key={feature}>
          {feature === "gold" ? <GoldTrading /> : <YouTubeHelper />}
        </div>
      </div>
      <nav
        className="feature-nav-dock glass fixed bottom-[calc(var(--tg-safe-area-inset-bottom,0px)+12px)] left-1/2 z-40 flex w-[min(520px,calc(100vw-32px))] -translate-x-1/2 items-center rounded-full p-1.5"
        aria-label={t("featureNavigation")}
        data-switch-direction={switchDirection ?? undefined}
        data-hidden={!navVisible ? "true" : undefined}
        aria-hidden={!navVisible}
        inert={!navVisible}
      >
        <span
          aria-hidden="true"
          className="feature-nav-indicator"
          data-feature={feature}
        />
        <button
          className={`${featureButtonClass} ${feature === "youtube" ? "is-active" : "text-muted hover:text-foreground"}`}
          style={feature === "youtube" ? selectedFeatureStyle : undefined}
          onClick={() => selectFeature("youtube")}
          type="button"
          aria-current={feature === "youtube" ? "page" : undefined}
        >
          <CirclePlay aria-hidden="true" size={22} strokeWidth={2.2} />
          <span>{t("youtube")}</span>
        </button>
        <button
          className={`${featureButtonClass} ${feature === "gold" ? "is-active" : "text-muted hover:text-foreground"}`}
          style={feature === "gold" ? selectedFeatureStyle : undefined}
          onClick={() => selectFeature("gold")}
          type="button"
          aria-current={feature === "gold" ? "page" : undefined}
        >
          <Coins aria-hidden="true" size={22} strokeWidth={2.2} />
          <span>{t("goldTrading")}</span>
        </button>
      </nav>
    </>
  );
}
