"use client";

import { useState } from "react";

type Variant = "mobile" | "desktop";

function pickVariant(): Variant {
  if (typeof window === "undefined") return "mobile";
  return window.matchMedia("(max-width: 700px)").matches ? "mobile" : "desktop";
}

/**
 * Khmer step-by-step video: "Add Helper to your Home Screen" (iPhone).
 * Files live in /public/demo/helper-home-screen-{mobile,desktop}.{mp4,webm,jpg}
 */
export function HomeScreenDemo({ className = "" }: { className?: string }) {
  const [variant] = useState<Variant>(pickVariant);
  const base = `/demo/helper-home-screen-${variant}`;
  const mobile = variant === "mobile";

  return (
    <div
      className={`mx-auto overflow-hidden rounded-2xl bg-slate-900 shadow-xl ${className}`}
      style={{ maxWidth: mobile ? 340 : 720, aspectRatio: mobile ? "9 / 16" : "16 / 9" }}
    >
      <video
        className="h-full w-full object-contain"
        autoPlay
        controls
        loop
        muted
        playsInline
        preload="metadata"
        poster={`${base}.jpg`}
        aria-label="របៀបបន្ថែម Helper ទៅ Home Screen"
      >
        <source src={`${base}.webm`} type='video/webm; codecs="vp9"' />
        <source src={`${base}.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}
