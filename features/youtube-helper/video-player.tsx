"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Repeat2, RotateCcw, RotateCw, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useLanguage } from "@/providers/language-provider";

interface YouTubePlayerProps {
  video: { id: string; title: string };
  favorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onOpenYouTube: () => void;
}

export function YouTubePlayer({
  video,
  favorite,
  onBack,
  onToggleFavorite,
  onShare,
  onOpenYouTube,
}: YouTubePlayerProps) {
  const [loop, setLoop] = useState(false);
  const [speed, setSpeed] = useState(1);
  const { hostRef, playerRef, error } = useYouTubePlayer(video.id, loop);
  const { t } = useLanguage();
  const isFavorite = favorite;
  const speeds = [1, 1.25, 1.5, 2, 0.5];
  const speedIndex = useRef(0);

  useEffect(() => {
    setLoop(false);
    setSpeed(1);
    speedIndex.current = 0;
  }, [video.id]);

  function seekBy(seconds: number) {
    try {
      const currentTime = playerRef.current?.getCurrentTime();
      if (typeof currentTime === "number" && playerRef.current) {
        playerRef.current.seekTo(Math.max(0, currentTime + seconds), true);
      }
    } catch {
      // The player may still be initializing.
    }
  }

  function changeSpeed() {
    speedIndex.current = (speedIndex.current + 1) % speeds.length;
    const nextSpeed = speeds[speedIndex.current];
    setSpeed(nextSpeed);
    try { playerRef.current?.setPlaybackRate(nextSpeed); } catch {
      // The player may still be initializing.
    }
  }

  return (
    <section className="view-enter mx-auto w-full max-w-2xl">
      <Button onClick={onBack}><ArrowLeft aria-hidden="true" size={17} />{t("back")}</Button>
      <div className="glass mt-4 aspect-video overflow-hidden rounded-2xl bg-black">
        <div className="size-full" id="youtube-player" ref={hostRef} />
      </div>
      <h1 className="mt-4 text-base font-semibold leading-6">{video.title || video.id}</h1>
      {error && <p className="mt-2 text-sm text-muted">{t("videoCannotPlay")}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button aria-label={t("backTenSeconds")} onClick={() => seekBy(-10)}><RotateCcw size={17} />10s</Button>
        <Button aria-label={t("forwardTenSeconds")} onClick={() => seekBy(10)}>10s<RotateCw size={17} /></Button>
        <Button aria-label={t("playbackSpeed")} onClick={changeSpeed}>{speed}x</Button>
        <Button aria-label={t("toggleLoop")} aria-pressed={loop} onClick={() => setLoop((value) => !value)} variant={loop ? "primary" : "secondary"}><Repeat2 size={17} /></Button>
        <Button aria-label={isFavorite ? t("removeFavorite") : t("addFavorite")} aria-pressed={isFavorite} onClick={onToggleFavorite} variant={isFavorite ? "primary" : "secondary"}><Star className={isFavorite ? "fill-current" : ""} size={17} /></Button>
        <Button aria-label={t("shareVideo")} onClick={onShare}><Send size={17} /></Button>
        <Button aria-label={t("openOnYouTube")} onClick={onOpenYouTube}><ExternalLink size={17} /></Button>
      </div>
    </section>
  );
}
