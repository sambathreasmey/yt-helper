"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/app-header";
import { HomeHero } from "@/components/home-hero";
import { ProfileCard } from "@/components/profile-card";
import { QuickActions } from "@/components/quick-actions";
import { VideoLinkForm } from "@/components/video-link-form";
import { VideoLibrary } from "@/components/video-library";
import { YouTubePlayer } from "@/features/youtube-helper/video-player";
import { YouTubeAdvertisement } from "@/features/youtube-helper/youtube-advertisement";
import { useTheme } from "@/providers/theme-provider";
import { useLanguage } from "@/providers/language-provider";
import { useTelegram } from "@/hooks/use-telegram";
import { useVideoLibrary } from "@/hooks/use-video-library";
import { getAutoRedirectSetting } from "@/services/dashboard-api";
import { fetchVideoTitle, parseYouTubeVideoId } from "@/services/youtube";
import { impactTelegram, openTelegramLink } from "@/services/telegram-client";
import type { LibraryVideo } from "@/services/library-storage";

type View = "home" | "player";

interface CurrentVideo {
  id: string;
  title: string;
}

const DEFAULT_AUTO_REDIRECT_SECONDS = 3;

export function YouTubeHelper() {
  const { appearance } = useTheme();
  const { t } = useLanguage();
  const { telegram, profile } = useTelegram();
  const library = useVideoLibrary(telegram);
  const autoRedirectQuery = useQuery({
    queryKey: ["app-settings", "auto-redirect"],
    queryFn: async () => {
      const response = await getAutoRedirectSetting();
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to load auto-redirect setting");
      }
      return response.data.seconds;
    },
    retry: false,
    staleTime: 60_000,
  });
  const [view, setView] = useState<View>("home");
  const [video, setVideo] = useState<CurrentVideo | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const didInitialize = useRef(false);

  const playVideo = useCallback((videoId: string) => {
    setCountdown(null);
    setVideo({ id: videoId, title: videoId });
    setView("player");
    const videoRecord: LibraryVideo = { id: videoId, t: videoId };
    library.addToHistory(videoRecord);
    fetchVideoTitle(videoId).then((title) => {
      const updated: LibraryVideo = { id: videoId, t: title };
      setVideo((current) => (current?.id === videoId ? { ...current, title } : current));
      library.updateLibraryTitle(updated);
    });
  }, [library.addToHistory, library.updateLibraryTitle, telegram]);

  useEffect(() => {
    if (!library.ready || autoRedirectQuery.isPending || didInitialize.current) return;
    didInitialize.current = true;

    const deepLink = parseYouTubeVideoId(new URLSearchParams(window.location.search).get("v")) ||
      parseYouTubeVideoId(telegram?.initDataUnsafe?.start_param);
    if (deepLink) playVideo(deepLink);
    else {
      const delay = autoRedirectQuery.data ?? DEFAULT_AUTO_REDIRECT_SECONDS;
      setCountdown(delay > 0 ? delay : null);
    }
  }, [autoRedirectQuery.data, autoRedirectQuery.isPending, library.ready, playVideo, telegram]);

  useEffect(() => {
    if (countdown === null || countdown === 0) return undefined;
    impactTelegram(telegram, "light");
    const timer = window.setInterval(() => {
      setCountdown((remaining) => (remaining === null ? null : Math.max(remaining - 1, 0)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown, telegram]);

  const navigateToYouTube = useCallback((url = "https://m.youtube.com", options: { browser?: boolean } = {}) => {
    setCountdown(null);
    openTelegramLink(telegram, url, options);
  }, [telegram]);

  useEffect(() => {
    if (countdown === 0) {
      impactTelegram(telegram, "medium");
      navigateToYouTube();
    }
  }, [countdown, navigateToYouTube, telegram]);

  useEffect(() => {
    if (countdown === null) return undefined;
    const cancel = (event: Event) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-countdown-trigger]")) setCountdown(null);
    };
    document.addEventListener("pointerdown", cancel, true);
    document.addEventListener("keydown", cancel, true);
    return () => {
      document.removeEventListener("pointerdown", cancel, true);
      document.removeEventListener("keydown", cancel, true);
    };
  }, [countdown]);


  const returnHome = useCallback(() => {
    setCountdown(null);
    setView("home");
    try { telegram?.BackButton?.hide?.(); } catch {
      // Older Telegram clients may not implement the Back Button API.
    }
    window.scrollTo(0, 0);
  }, [telegram]);

  useEffect(() => {
    const backButton = telegram?.BackButton;
    if (!backButton) return undefined;
    const onBack = () => returnHome();
    if (view === "home") backButton.hide?.();
    else backButton.show?.();
    backButton.onClick?.(onBack);
    return () => backButton.offClick?.(onBack);
  }, [returnHome, telegram, view]);

  function addToHomeScreen() {
    try { telegram?.addToHomeScreen?.(); } catch {
      // Home screen installation is only available in supported Telegram clients.
    }
  }

  function shareVideo() {
    if (!video) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent(`https://youtu.be/${video.id}`)}&text=${encodeURIComponent(video.title || "")}`;
    if (telegram?.openTelegramLink) telegram.openTelegramLink(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  }

  const isFavorite = Boolean(video && library.favorites.some((favorite) => favorite.id === video.id));
  const quickActions = (
    <QuickActions
      onAddToHome={addToHomeScreen}
      onOpen={navigateToYouTube}
      showAddToHome={Boolean(telegram?.addToHomeScreen)}
    />
  );
  const videoLinkForm = <VideoLinkForm onPlay={playVideo} />;

  return (
    <main className="layout-main mx-auto w-full max-w-[520px]">
      {view === "home" ? (
        <section className="layout-shell view-enter" data-layout={appearance.layout}>
          <AppHeader />
          {autoRedirectQuery.error && (
            <p className="auto-redirect-error" role="status">
              {t("autoRedirectSettingUnavailable", { seconds: DEFAULT_AUTO_REDIRECT_SECONDS })}
            </p>
          )}
          <YouTubeAdvertisement />
          <HomeHero
            countdown={countdown}
            countdownDurationSeconds={autoRedirectQuery.data ?? DEFAULT_AUTO_REDIRECT_SECONDS}
            onOpenYouTube={() => navigateToYouTube("https://m.youtube.com", { browser: true })}
          />
          <ProfileCard profile={profile} />
          {appearance.layout === "dashboard"
            ? <>{quickActions}{videoLinkForm}</>
            : <>{videoLinkForm}{quickActions}</>}
          <VideoLibrary
            favorites={library.favorites}
            history={library.history}
            onPlay={playVideo}
          />
        </section>
      ) : video ? (
        <>
          <AppHeader />
          <YouTubePlayer
            favorite={isFavorite}
            onBack={returnHome}
            onOpenYouTube={() => navigateToYouTube(`https://youtu.be/${video.id}`)}
            onShare={shareVideo}
            onToggleFavorite={() => {
              library.toggleFavorite({ id: video.id, t: video.title });
            }}
            video={video}
          />
        </>
      ) : null}
    </main>
  );
}
