"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import { ThemePanel } from "@/components/theme-panel";
import { themeModes } from "@/components/theme-picker-options";

export function ThemePicker() {
  const { appearance } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const activeMode = themeModes.find((mode) => mode.value === appearance.mode) || themeModes[0];

  useEffect(() => {
    if (!open) return undefined;
    const dismiss = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Customize appearance"
        className="h-9 min-h-9 rounded-full px-3 text-xs"
        onClick={() => setOpen((value) => !value)}
      >
        <Palette aria-hidden="true" size={15} />
        <span className="hidden sm:inline">Customize</span>
        <ChevronDown aria-hidden="true" className={cn("transition-transform", open && "rotate-180")} size={13} />
      </Button>
      {open && <ThemePanel activeModeIcon={activeMode.icon} />}
    </div>
  );
}
