"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Repeat2, RotateCcw, RotateCw, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";

export function YouTubePlayer({
  video,
  favorite,
  onBack,
  onToggleFavorite,
  onShare,
  onOpenYouTube,
  language = "en",
}) {
  const [loop, setLoop] = useState(false);
  const [speed, setSpeed] = useState(1);
  const { hostRef, playerRef, error } = useYouTubePlayer(video.id, loop);
  const isKhmer = language === "km";
  const isFavorite = favorite;
  const speeds = [1, 1.25, 1.5, 2, 0.5];
  const speedIndex = useRef(0);

  useEffect(() => {
    setLoop(false);
    setSpeed(1);
    speedIndex.current = 0;
  }, [video.id]);

  function seekBy(seconds) {
    try {
      const currentTime = playerRef.current?.getCurrentTime();
      if (typeof currentTime === "number") playerRef.current.seekTo(Math.max(0, currentTime + seconds), true);
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
      <Button onClick={onBack}><ArrowLeft aria-hidden="true" size={17} />{isKhmer ? "ត្រឡប់ក្រោយ" : "Back"}</Button>
      <div className="glass mt-4 aspect-video overflow-hidden rounded-2xl bg-black">
        <div className="size-full" id="youtube-player" ref={hostRef} />
      </div>
      <h1 className="mt-4 text-base font-semibold leading-6">{video.title || video.id}</h1>
      {error && <p className="mt-2 text-sm text-muted">{isKhmer ? "មិនអាចចាក់វីដេអូនេះបានទេ។ សូមបើកក្នុង YouTube។" : "This video can't play here. Open it in YouTube."}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button aria-label="Back 10 seconds" onClick={() => seekBy(-10)}><RotateCcw size={17} />10s</Button>
        <Button aria-label="Forward 10 seconds" onClick={() => seekBy(10)}>10s<RotateCw size={17} /></Button>
        <Button aria-label="Change playback speed" onClick={changeSpeed}>{speed}x</Button>
        <Button aria-label="Toggle loop" aria-pressed={loop} onClick={() => setLoop((value) => !value)} variant={loop ? "primary" : "secondary"}><Repeat2 size={17} /></Button>
        <Button aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"} aria-pressed={isFavorite} onClick={onToggleFavorite} variant={isFavorite ? "primary" : "secondary"}><Star className={isFavorite ? "fill-current" : ""} size={17} /></Button>
        <Button aria-label="Share video" onClick={onShare}><Send size={17} /></Button>
        <Button aria-label="Open on YouTube" onClick={onOpenYouTube}><ExternalLink size={17} /></Button>
      </div>
    </section>
  );
}
