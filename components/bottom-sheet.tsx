"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/providers/language-provider";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

const EXIT_MS = 240;
const CLOSE_DRAG_PX = 110;

/**
 * Mobile bottom sheet: slides up, closes on backdrop tap / Escape / Telegram back button / drag down,
 * sits above the on-screen keyboard, and locks the page behind it.
 * Children are only mounted while the sheet is open, so forms start fresh each time.
 */
export function BottomSheet({ open, onClose, title, description, icon, children }: BottomSheetProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Mount, then show on the next frame so the slide-in transition runs; reverse on close.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = window.requestAnimationFrame(() => window.requestAnimationFrame(() => setVisible(true)));
      return () => window.cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  const requestClose = useCallback(() => closeRef.current(), []);

  // Lock the page behind the sheet, wire Escape and the Telegram back button.
  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    root.dataset.sheet = "open";
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);

    const backButton = window.Telegram?.WebApp?.BackButton;
    try {
      backButton?.onClick?.(requestClose);
      backButton?.show?.();
    } catch {
      // Back button is not available in every Telegram client.
    }

    const viewport = window.visualViewport;
    const syncKeyboard = () => {
      if (!viewport) return;
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      root.style.setProperty("--sheet-kb", `${covered}px`);
      root.style.setProperty("--sheet-vh", `${viewport.height}px`);
    };
    syncKeyboard();
    viewport?.addEventListener("resize", syncKeyboard);
    viewport?.addEventListener("scroll", syncKeyboard);

    const focusTimer = window.setTimeout(() => panelRef.current?.focus({ preventScroll: true }), 60);

    return () => {
      delete root.dataset.sheet;
      document.body.style.overflow = previousOverflow;
      root.style.removeProperty("--sheet-kb");
      root.style.removeProperty("--sheet-vh");
      window.removeEventListener("keydown", onKey);
      viewport?.removeEventListener("resize", syncKeyboard);
      viewport?.removeEventListener("scroll", syncKeyboard);
      window.clearTimeout(focusTimer);
      try {
        backButton?.offClick?.(requestClose);
        backButton?.hide?.();
      } catch {
        // Ignore unsupported back button.
      }
    };
  }, [open, requestClose]);

  // Drag the header down to dismiss.
  const dragStart = useRef<number | null>(null);
  const dragDistance = useRef(0);
  const onDragStart = (event: React.TouchEvent) => {
    dragStart.current = event.touches[0].clientY;
    dragDistance.current = 0;
  };
  const onDragMove = (event: React.TouchEvent) => {
    if (dragStart.current === null || !panelRef.current) return;
    dragDistance.current = Math.max(0, event.touches[0].clientY - dragStart.current);
    panelRef.current.style.transition = "none";
    panelRef.current.style.transform = `translate3d(0, ${dragDistance.current}px, 0)`;
  };
  const onDragEnd = () => {
    if (dragStart.current === null || !panelRef.current) return;
    const shouldClose = dragDistance.current > CLOSE_DRAG_PX;
    dragStart.current = null;
    panelRef.current.style.transition = "";
    panelRef.current.style.transform = "";
    if (shouldClose) requestClose();
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="sheet-root" data-visible={visible ? "true" : "false"} data-no-ptr>
      <div aria-hidden="true" className="sheet-backdrop" onClick={requestClose} />
      <div
        aria-label={title}
        aria-modal="true"
        className={cn("sheet-panel", "glass")}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div
          className="sheet-header"
          onTouchEnd={onDragEnd}
          onTouchMove={onDragMove}
          onTouchStart={onDragStart}
        >
          <span aria-hidden="true" className="sheet-grabber" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {icon && <span className="gold-card-heading-icon shrink-0" aria-hidden="true">{icon}</span>}
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-tight">{title}</h2>
                {description && <p className="mt-1 text-xs leading-snug text-muted">{description}</p>}
              </div>
            </div>
            <button aria-label={t("close")} className="sheet-close" onClick={requestClose} type="button">
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
