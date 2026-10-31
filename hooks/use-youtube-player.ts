"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export interface YouTubePlayerInstance {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  playVideo: () => void;
  destroy: () => void;
}

interface YouTubeNamespace {
  Player: new (
    elementId: string,
    options: {
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, number>;
      events: {
        onStateChange: (event: { data: number }) => void;
        onError: () => void;
      };
    },
  ) => YouTubePlayerInstance;
  PlayerState: { ENDED: number };
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let iframeApiPromise: Promise<YouTubeNamespace> | undefined;

function loadYouTubeIframeApi(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube player API loaded without a Player constructor."));
    };

    let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    const shouldAppend = !script;
    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
    }
    script.addEventListener("error", () => {
      iframeApiPromise = undefined;
      reject(new Error("Failed to load the YouTube player API."));
    }, { once: true });
    if (shouldAppend) document.head.appendChild(script);
  });

  return iframeApiPromise;
}

export function useYouTubePlayer(videoId: string, loop: boolean): {
  hostRef: RefObject<HTMLDivElement | null>;
  playerRef: RefObject<YouTubePlayerInstance | null>;
  error: boolean;
} {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const loopRef = useRef(loop);
  const [error, setError] = useState(false);

  loopRef.current = loop;

  useEffect(() => {
    let active = true;
    setError(false);

    loadYouTubeIframeApi()
      .then((youtube) => {
        if (!active || !hostRef.current) return;

        const player: YouTubePlayerInstance = new youtube.Player(hostRef.current.id, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onStateChange: (event) => {
              if (event.data === youtube.PlayerState.ENDED && loopRef.current) {
                player.seekTo(0, true);
                player.playVideo();
              }
            },
            onError: () => setError(true),
          },
        });
        playerRef.current = player;
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  return { hostRef, playerRef, error };
}
