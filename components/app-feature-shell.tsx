"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CirclePlay, Coins, Megaphone, ShieldCheck } from "lucide-react";
import { GoldPageSkeleton } from "@/components/gold-skeleton";
import { YouTubeHelper } from "@/features/youtube-helper/youtube-helper";
import { useTelegram } from "@/hooks/use-telegram";
import { useGlobalAppSettings } from "@/hooks/use-global-app-settings";
import { useLanguage } from "@/providers/language-provider";
import { DEFAULT_GLOBAL_APP_SETTINGS } from "@/services/dashboard-api";

type AppFeature = "youtube" | "gold";

const GoldTrading = dynamic(
  () => import("@/features/gold-trading/gold-trading").then((module) => module.GoldTrading),
  { loading: GoldPageSkeleton },
);

export function AppFeatureShell() {
  const [feature, setFeature] = useState<AppFeature>("youtube");
  const [switchDirection, setSwitchDirection] = useState<AppFeature | null>(null);
  const [navVisible, setNavVisible] = useState(true);
  const { telegram } = useTelegram();
  const { t } = useLanguage();
  const globalSettingsQuery = useGlobalAppSettings();
  const globalSettings = globalSettingsQuery.data ?? DEFAULT_GLOBAL_APP_SETTINGS;
  const youtubeEnabled = globalSettings.youtube_enabled;
  const goldEnabled = globalSettings.gold_trade_enabled;
  const maintenanceMode = globalSettings.maintenance_mode;
  const isAdmin = telegram?.initDataUnsafe?.user?.id === 762808963;
  const visibleFeature: AppFeature = feature === "youtube" && youtubeEnabled
    ? "youtube"
    : feature === "gold" && goldEnabled
      ? "gold"
      : youtubeEnabled
        ? "youtube"
        : "gold";

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
    window.visualViewport?.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.visualViewport?.removeEventListener("scroll", handleScroll);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (focusFrame) window.cancelAnimationFrame(focusFrame);
    };
  }, []);

  useEffect(() => {
    if (maintenanceMode) return;
    if (feature === "youtube" && !youtubeEnabled && goldEnabled) setFeature("gold");
    else if (feature === "gold" && !goldEnabled && youtubeEnabled) setFeature("youtube");
  }, [feature, goldEnabled, maintenanceMode, youtubeEnabled]);

  const featureButtonClass =
    "feature-nav-button transition-all duration-200";
  const selectedFeatureStyle = {
    color: "var(--accent)",
  };

  function selectFeature(nextFeature: AppFeature) {
    if (nextFeature === visibleFeature) return;
    if (nextFeature === "youtube" && !youtubeEnabled) return;
    if (nextFeature === "gold" && !goldEnabled) return;
    setSwitchDirection(nextFeature);
    setFeature(nextFeature);
  }

  return (
    <>
      {maintenanceMode ? (
        <main className="global-maintenance mx-auto my-8 w-[min(520px,calc(100%-32px))]">
          <span className="global-maintenance-icon"><AlertTriangle aria-hidden="true" size={24} /></span>
          <h1>{t("maintenanceTitle")}</h1>
          <p>{globalSettings.maintenance_message}</p>
          {globalSettings.support_url && (
            <a href={globalSettings.support_url} rel="noreferrer" target="_blank">
              {t("contactSupport")} <ArrowUpRight aria-hidden="true" size={15} />
            </a>
          )}
        </main>
      ) : (
        <>
          {globalSettingsQuery.isError && (
            <p className="global-settings-error mx-auto mb-3 w-[min(520px,calc(100%-32px))]" role="status">
              {t("globalSettingsUnavailable")}
            </p>
          )}
          {globalSettings.announcement_enabled && (
            <aside className="global-announcement mx-auto mb-3 w-[min(520px,calc(100%-32px))]" aria-label={t("announcement")}>
              <span className="global-announcement-icon"><Megaphone aria-hidden="true" size={18} /></span>
              <div className="min-w-0 flex-1">
                <h2>{globalSettings.announcement_title}</h2>
                <p>{globalSettings.announcement_message}</p>
              </div>
              {globalSettings.announcement_link_url && (
                <a aria-label={t("learnMore")} href={globalSettings.announcement_link_url} rel="noreferrer" target="_blank">
                  <ArrowUpRight aria-hidden="true" size={18} />
                </a>
              )}
            </aside>
          )}
          {youtubeEnabled || goldEnabled ? (
            <div className="mx-auto w-full max-w-[520px] pb-24">
              <div className="feature-page-enter" key={visibleFeature}>
                {visibleFeature === "gold" ? <GoldTrading /> : <YouTubeHelper />}
              </div>
            </div>
          ) : (
            <main className="global-maintenance mx-auto my-8 w-[min(520px,calc(100%-32px))]">
              <h1>{t("featuresUnavailable")}</h1>
              {globalSettings.support_url && (
                <a href={globalSettings.support_url} rel="noreferrer" target="_blank">
                  {t("contactSupport")} <ArrowUpRight aria-hidden="true" size={15} />
                </a>
              )}
            </main>
          )}
        </>
      )}
      {(!maintenanceMode || isAdmin) && (
        <nav
          className="feature-nav-dock glass fixed bottom-[calc(var(--tg-safe-area-inset-bottom,0px)+12px)] left-1/2 z-40 flex w-[min(520px,calc(100vw-32px))] -translate-x-1/2 items-center rounded-full p-1.5"
          aria-label={t("featureNavigation")}
          data-switch-direction={switchDirection ?? undefined}
          data-hidden={!navVisible ? "true" : undefined}
          data-item-count={(maintenanceMode ? 0 : Number(youtubeEnabled) + Number(goldEnabled)) + Number(isAdmin)}
          aria-hidden={!navVisible}
          inert={!navVisible}
        >
          {!maintenanceMode && (
            (youtubeEnabled && goldEnabled) || (isAdmin && (youtubeEnabled || goldEnabled))
          ) && (
            <span aria-hidden="true" className="feature-nav-indicator" data-feature={visibleFeature} />
          )}
          {!maintenanceMode && youtubeEnabled && (
            <button
              className={`${featureButtonClass} ${visibleFeature === "youtube" ? "is-active" : "text-muted hover:text-foreground"}`}
              style={visibleFeature === "youtube" ? selectedFeatureStyle : undefined}
              onClick={() => selectFeature("youtube")}
              type="button"
              aria-current={visibleFeature === "youtube" ? "page" : undefined}
            >
              <CirclePlay aria-hidden="true" size={22} strokeWidth={2.2} />
              <span>{t("youtube")}</span>
            </button>
          )}
          {!maintenanceMode && goldEnabled && (
            <button
              className={`${featureButtonClass} ${visibleFeature === "gold" ? "is-active" : "text-muted hover:text-foreground"}`}
              style={visibleFeature === "gold" ? selectedFeatureStyle : undefined}
              onClick={() => selectFeature("gold")}
              type="button"
              aria-current={visibleFeature === "gold" ? "page" : undefined}
            >
              <Coins aria-hidden="true" size={22} strokeWidth={2.2} />
              <span>{t("goldTrading")}</span>
            </button>
          )}
          {isAdmin && (
            <Link
              className={`${featureButtonClass} text-muted hover:text-foreground`}
              href="/admin"
            >
              <ShieldCheck aria-hidden="true" size={22} strokeWidth={2.2} />
              <span>{t("adminMenu")}</span>
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
