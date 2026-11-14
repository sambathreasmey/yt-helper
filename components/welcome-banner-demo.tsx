"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { Play, X } from "lucide-react";
import { useLanguage } from "@/providers/language-provider";

export function WelcomeBannerDemo() {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [videoSource, setVideoSource] = useState<string | undefined>();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReducedMotion(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    if (!("IntersectionObserver" in window)) {
      setPreviewReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPreviewReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog || dialog.open) return;
    dialog.showModal();
    void playerRef.current?.play().catch(() => setPlaybackBlocked(true));
  }, [isOpen]);

  function openDemo() {
    setPlaybackBlocked(false);
    setVideoSource(
      window.matchMedia("(max-width: 700px)").matches
        ? "/demo/helper-home-screen-mobile.mp4"
        : "/demo/helper-home-screen-desktop.mp4",
    );
    setIsOpen(true);
  }

  function stopPlayback() {
    const player = playerRef.current;
    player?.pause();
    if (player) {
      player.removeAttribute("src");
      player.load();
    }
    setIsOpen(false);
    setVideoSource(undefined);
    setPlaybackBlocked(false);
  }

  function closeDemo() {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    else stopPlayback();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) closeDemo();
  }

  function playWithSound() {
    setPlaybackBlocked(false);
    void playerRef.current?.play().catch(() => setPlaybackBlocked(true));
  }

  return (
    <>
      <section
        aria-label={t("homeGuideTitle")}
        className="welcome-demo-preview relative isolate mb-7 overflow-hidden rounded-[1.5rem] border border-white/10 bg-surface shadow-glass sm:mb-9 sm:rounded-[1.75rem]"
      >
        <div ref={containerRef} className="relative aspect-[1.9/1] w-full">
          <Image
            alt=""
            className="object-cover"
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            src="/demo/helper-home-screen-desktop.jpg"
          />
          {previewReady && !reducedMotion && (
            <video
              aria-hidden="true"
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
              loop
              muted
              playsInline
              poster="/demo/helper-home-screen-desktop.jpg"
              preload="none"
              tabIndex={-1}
            >
              <source src="/demo/helper-home-screen-preview.webm" type="video/webm" />
            </video>
          )}
          <div
            aria-hidden="true"
            className="welcome-banner-shade pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07142c]/40 via-transparent to-transparent"
          />
          <button
            aria-haspopup="dialog"
            aria-label={t("homeGuideTitle")}
            className="welcome-demo-trigger absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-transparent text-inherit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-white"
            onClick={openDemo}
            type="button"
          >
            <span className="flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-5 py-3 text-sm font-bold text-white shadow-xl backdrop-blur-md transition hover:scale-105">
              <Play aria-hidden="true" className="fill-current" size={18} />
              {t("homeGuideTitle")}
            </span>
          </button>
        </div>
      </section>

      <dialog
        aria-label={t("homeGuideTitle")}
        className="welcome-demo-dialog fixed inset-0 m-auto w-[min(960px,calc(100%-32px))] max-h-[90vh] border-0 bg-transparent p-0 text-white"
        onClick={handleDialogClick}
        onClose={() => {
          stopPlayback();
        }}
        ref={dialogRef}
      >
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm font-semibold">{t("homeGuideTitle")}</p>
            <button
              aria-label={t("close")}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              onClick={closeDemo}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
          {isOpen && (
            <div className="relative">
              <video
                aria-label={t("homeGuideHint")}
                autoPlay
                className="mx-auto max-h-[80vh] w-full bg-black object-contain"
                controls
                playsInline
                preload="none"
                src={videoSource}
                ref={playerRef}
              >
              </video>
              {playbackBlocked && (
                <button
                  className="absolute inset-0 m-auto flex h-fit w-fit items-center gap-2 rounded-full bg-black/75 px-5 py-3 text-sm font-bold text-white"
                  onClick={playWithSound}
                  type="button"
                >
                  <Play aria-hidden="true" className="fill-current" size={18} />
                  {t("tapToPlay")}
                </button>
              )}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
