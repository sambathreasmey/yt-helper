"use client";

import { useEffect, useRef, useState } from "react";

let iframeApiPromise;

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube player API loaded without a Player constructor."));
    };

    let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    const shouldAppend = !script;
    if (shouldAppend) {
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

export function useYouTubePlayer(videoId, loop) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const loopRef = useRef(loop);
  const [error, setError] = useState(false);

  loopRef.current = loop;

  useEffect(() => {
    let active = true;
    setError(false);

    loadYouTubeIframeApi()
      .then((youtube) => {
        if (!active || !hostRef.current) return;

        const player = new youtube.Player(hostRef.current.id, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onStateChange: (event) => {
              if (event.data === youtube.PlayerState.ENDED && loopRef.current) {
                player.seekTo(0);
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
