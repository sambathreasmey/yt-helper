"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { HomeHero } from "@/components/home-hero";
import { ProfileCard } from "@/components/profile-card";
import { QuickActions } from "@/components/quick-actions";
import { VideoLinkForm } from "@/components/video-link-form";
import { VideoLibrary } from "@/components/video-library";
import { YouTubePlayer } from "@/features/youtube-helper/video-player";
import { useTelegram } from "@/hooks/use-telegram";
import { useVideoLibrary } from "@/hooks/use-video-library";
import { fetchVideoTitle, parseYouTubeVideoId } from "@/services/youtube";
import { impactTelegram, openTelegramLink } from "@/services/telegram-client";

export function YouTubeHelper() {
  const { telegram, profile } = useTelegram();
  const library = useVideoLibrary(telegram);
  const [view, setView] = useState("home");
  const [video, setVideo] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const didInitialize = useRef(false);
  const language = telegram?.initDataUnsafe?.user?.language_code || "en";

  const playVideo = useCallback((videoId) => {
    setCountdown(null);
    setVideo({ id: videoId, title: videoId });
    setView("player");
    impactTelegram(telegram, "light");

    const videoRecord = { id: videoId, t: videoId };
    library.addToHistory(videoRecord);
    fetchVideoTitle(videoId).then((title) => {
      const updated = { id: videoId, t: title };
      setVideo((current) => current?.id === videoId ? { ...current, title } : current);
      library.updateLibraryTitle(updated);
    });
  }, [library.addToHistory, library.updateLibraryTitle, telegram]);

  useEffect(() => {
    if (!library.ready || didInitialize.current) return;
    didInitialize.current = true;

    const deepLink = parseYouTubeVideoId(new URLSearchParams(window.location.search).get("v")) ||
      parseYouTubeVideoId(telegram?.initDataUnsafe?.start_param);
    if (deepLink) playVideo(deepLink);
    else setCountdown(3);
  }, [library.ready, playVideo, telegram]);

  useEffect(() => {
    if (countdown === null || countdown === 0) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((remaining) => remaining === null ? null : Math.max(remaining - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const navigateToYouTube = useCallback((url = "https://m.youtube.com") => {
    setCountdown(null);
    impactTelegram(telegram);
    openTelegramLink(telegram, url);
  }, [telegram]);

  useEffect(() => {
    if (countdown === 0) navigateToYouTube();
  }, [countdown, navigateToYouTube]);

  useEffect(() => {
    if (countdown === null) return undefined;
    const cancel = (event) => {
      if (!event.target.closest?.("[data-countdown-trigger]")) setCountdown(null);
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
    try { telegram?.BackButton?.hide(); } catch {
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
    impactTelegram(telegram);
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

  return (
    <main className="mx-auto w-full max-w-[520px]">
      {view === "home" ? (
        <section className="view-enter">
          <AppHeader />
          <HomeHero countdown={countdown} language={language} onOpenYouTube={() => navigateToYouTube()} />
          <ProfileCard profile={profile} />
          <VideoLinkForm language={language} onPlay={playVideo} />
          <QuickActions
            onAddToHome={addToHomeScreen}
            onOpen={navigateToYouTube}
            showAddToHome={Boolean(telegram?.addToHomeScreen)}
          />
          <VideoLibrary
            favorites={library.favorites}
            history={library.history}
            language={language}
            onPlay={playVideo}
          />
        </section>
      ) : video ? (
        <YouTubePlayer
          favorite={isFavorite}
          language={language}
          onBack={returnHome}
          onOpenYouTube={() => navigateToYouTube(`https://youtu.be/${video.id}`)}
          onShare={shareVideo}
          onToggleFavorite={() => {
            impactTelegram(telegram, "medium");
            library.toggleFavorite({ id: video.id, t: video.title });
          }}
          video={video}
        />
      ) : null}
    </main>
  );
}
