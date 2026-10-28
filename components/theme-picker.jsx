"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Monitor, Moon, Palette, RotateCcw, Sun, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";

const themeModes = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const accents = [
  { value: "neutral", label: "Stone", color: "#a1a1aa" },
  { value: "rose", label: "Rose", color: "#ec7892" },
  { value: "lavender", label: "Lavender", color: "#aa85ed" },
  { value: "mint", label: "Mint", color: "#5fc4a3" },
  { value: "ocean", label: "Ocean", color: "#69a9e3" },
  { value: "peach", label: "Peach", color: "#efa276" },
];

const optionGroups = [
  {
    key: "surface",
    label: "Card style",
    options: [
      { value: "glass", label: "Glass" },
      { value: "solid", label: "Solid" },
    ],
  },
  {
    key: "corners",
    label: "Corner shape",
    options: [
      { value: "soft", label: "Soft" },
      { value: "rounded", label: "Round" },
      { value: "sharp", label: "Sharp" },
    ],
  },
];

export function ThemePicker() {
  const { appearance, setPreference, resetAppearance } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const activeMode = themeModes.find((mode) => mode.value === appearance.mode) || themeModes[0];
  const ActiveModeIcon = activeMode.icon;

  useEffect(() => {
    if (!open) return undefined;
    const dismiss = (event) => {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
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

      {open && (
        <section
          aria-label="Appearance settings"
          className="appearance-panel glass absolute right-0 top-[calc(100%+10px)] z-50 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-3xl p-4 shadow-2xl"
          role="dialog"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-strong text-accent">
                <WandSparkles aria-hidden="true" size={17} />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Make it yours</h2>
                <p className="mt-1 text-xs text-muted">Your look, saved on this device.</p>
              </div>
            </div>
            <span className="mt-1 text-muted" aria-hidden="true"><ActiveModeIcon size={15} /></span>
          </div>

          <fieldset>
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Appearance</legend>
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1">
              {themeModes.map(({ value, label, icon: Icon }) => (
                <button
                  aria-pressed={appearance.mode === value}
                  className={cn(
                    "flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-medium text-muted transition-colors hover:text-foreground",
                    appearance.mode === value && "bg-surface-strong text-foreground shadow-sm",
                  )}
                  key={value}
                  onClick={() => setPreference("mode", value)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={14} />{label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Accent color</legend>
            <div className="grid grid-cols-6 gap-2">
              {accents.map((accent) => (
                <button
                  aria-label={`${accent.label} accent`}
                  aria-pressed={appearance.accent === accent.value}
                  className={cn(
                    "grid size-9 place-items-center rounded-full border-2 border-transparent transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    appearance.accent === accent.value && "border-foreground",
                  )}
                  key={accent.value}
                  onClick={() => setPreference("accent", accent.value)}
                  style={{ backgroundColor: accent.color }}
                  title={accent.label}
                  type="button"
                >
                  {appearance.accent === accent.value && <Check aria-hidden="true" className="text-white drop-shadow" size={16} />}
                </button>
              ))}
            </div>
          </fieldset>

          {optionGroups.map((group) => (
            <fieldset className="mt-4 flex items-center justify-between gap-3" key={group.key}>
              <legend className="sr-only">{group.label}</legend>
              <span className="text-xs font-medium">{group.label}</span>
              <div className="flex rounded-xl bg-surface p-1">
                {group.options.map((option) => (
                  <button
                    aria-pressed={appearance[group.key] === option.value}
                    className={cn(
                      "min-h-8 rounded-lg px-2.5 text-[11px] font-medium text-muted transition-colors hover:text-foreground",
                      appearance[group.key] === option.value && "bg-surface-strong text-foreground shadow-sm",
                    )}
                    key={option.value}
                    onClick={() => setPreference(group.key, option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
              <input
                checked={appearance.motion}
                className="size-4 accent-[var(--accent)]"
                onChange={(event) => setPreference("motion", event.target.checked)}
                type="checkbox"
              />
              Animations
            </label>
            <button
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
              onClick={resetAppearance}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={13} />Reset
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
