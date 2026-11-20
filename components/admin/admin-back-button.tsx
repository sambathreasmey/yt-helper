"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const LAST_FEATURE_KEY = "helper-last-feature";

/** The page the user was on before opening Admin: Gold trading or YouTube (YouTube if unknown). */
function readLastFeature(): "gold" | "youtube" {
  if (typeof window === "undefined") return "youtube";
  try {
    return window.localStorage.getItem(LAST_FEATURE_KEY) === "gold" ? "gold" : "youtube";
  } catch {
    return "youtube";
  }
}

/**
 * "Back" button for the admin screens. It returns to the main app, which opens on the page
 * the user left (Gold trading or YouTube), and its label says which one.
 */
export function AdminBackButton({ className = "" }: { className?: string }) {
  const [target] = useState(readLastFeature);
  const label = target === "gold" ? "Gold trading" : "YouTube";

  return (
    <Link
      aria-label={`Back to ${label}`}
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-surface-strong px-3.5 py-2 text-sm font-semibold text-foreground transition-transform active:scale-95 ${className}`}
      href="/"
    >
      <ArrowLeft aria-hidden="true" size={16} />
      <span>{label}</span>
    </Link>
  );
}
