"use client";

import type { ComponentType, CSSProperties } from "react";
import { Check, RotateCcw, Sparkles, WandSparkles, type LucideProps } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import {
  accents,
  animationStyles,
  appIcons,
  backgrounds,
  layouts,
  optionGroups,
  themeModes,
} from "@/components/theme-picker-options";

const sectionLabel = "mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted";

export function ThemePanel({ activeModeIcon: ActiveModeIcon }: { activeModeIcon: ComponentType<LucideProps> }) {
  const { appearance, setPreference, resetAppearance } = useTheme();

  return (
    <section
      aria-label="Appearance settings"
      className="appearance-panel glass absolute right-0 top-[calc(100%+10px)] z-50 max-h-[min(80vh,42rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl p-4 shadow-2xl"
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
        <legend className={sectionLabel}>Accent color</legend>
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

      <fieldset className="mt-4">
        <legend className={sectionLabel}>App icon</legend>
        <div className="grid grid-cols-5 gap-2">
          {appIcons.map(({ value, label, icon: Icon }) => (
            <button
              aria-label={`${label} app icon`}
              aria-pressed={appearance.appIcon === value}
              className={cn(
                "relative grid size-10 place-items-center rounded-xl border border-border bg-surface text-muted transition-colors hover:bg-surface-strong hover:text-foreground",
                appearance.appIcon === value && "border-accent bg-accent-soft text-accent",
              )}
              key={value}
              onClick={() => setPreference("appIcon", value)}
              title={label}
              type="button"
            >
              <Icon aria-hidden="true" size={18} />
              {appearance.appIcon === value && <Check aria-hidden="true" className="absolute -right-1 -top-1 rounded-full bg-background p-0.5 text-accent" size={13} />}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className={sectionLabel}>Background · 12 styles</legend>
        <div className="grid grid-cols-3 gap-2">
          {backgrounds.map(({ value, label, icon: Icon }) => (
            <button
              aria-pressed={appearance.background === value}
              className={cn(
                "background-choice flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-border px-1.5 py-2 text-[10px] font-medium text-muted transition hover:border-accent/50 hover:text-foreground",
                `background-preview-${value}`,
                appearance.background === value && "border-accent bg-accent-soft text-accent ring-1 ring-accent/40",
              )}
              key={value}
              onClick={() => setPreference("background", value)}
              type="button"
            >
              <Icon aria-hidden="true" size={16} />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className={sectionLabel}>Appearance</legend>
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
        <legend className="mb-2 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted">
          <span>Glass blur</span>
          <output className="rounded-full bg-accent-soft px-2 py-1 text-[10px] normal-case tracking-normal text-accent" htmlFor="glass-blur">
            {appearance.blur}%
          </output>
        </legend>
        <input
          aria-label="Glass blur amount"
          aria-valuetext={`${appearance.blur}% blur`}
          className="appearance-slider h-2 w-full cursor-pointer rounded-full bg-surface-strong"
          disabled={appearance.surface === "solid"}
          id="glass-blur"
          max="100"
          min="0"
          onChange={(event) => setPreference("blur", Number(event.target.value))}
          step="1"
          style={{ "--range-progress": `${appearance.blur}%` } as CSSProperties}
          type="range"
          value={appearance.blur}
        />
        <p className="mt-1 text-[10px] text-muted">
          {appearance.surface === "solid" ? "Choose Glass cards to adjust blur." : "Adjust how frosted the cards look."}
        </p>
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>Clear</span><span>Frosted</span>
        </div>
      </fieldset>

      {optionGroups.map((group) => (
        <fieldset className="mt-4 flex items-center justify-between gap-3" key={group.key}>
          <legend className="sr-only">{group.label}</legend>
          <span className="text-xs font-medium">{group.label}</span>
          <div className="flex flex-wrap justify-end rounded-xl bg-surface p-1">
            {group.options.map((option) => (
              <button
                aria-pressed={appearance[group.key] === option.value}
                className={cn(
                  "inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-medium text-muted transition-colors hover:text-foreground",
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

      <fieldset className="mt-4">
        <legend className={sectionLabel}>Animation style</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {animationStyles.map(({ value, label, icon: Icon }) => (
            <button
              aria-pressed={appearance.animationStyle === value}
              className={cn(
                "flex min-h-9 items-center justify-center gap-1 rounded-lg border border-border bg-surface px-1 text-[10px] font-medium text-muted transition hover:text-foreground",
                appearance.animationStyle === value && "border-accent bg-accent-soft text-accent",
              )}
              key={value}
              onClick={() => setPreference("animationStyle", value)}
              type="button"
            >
              <Icon aria-hidden="true" size={13} />{label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className={sectionLabel}>Page layout</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {layouts.map(({ value, label, icon: Icon }) => (
            <button
              aria-pressed={appearance.layout === value}
              className={cn(
                "flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-xs font-medium text-muted transition hover:text-foreground",
                appearance.layout === value && "border-accent bg-accent-soft text-accent",
              )}
              key={value}
              onClick={() => setPreference("layout", value)}
              type="button"
            >
              <Icon aria-hidden="true" size={15} />{label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
          <input
            checked={appearance.motion}
            className="size-4 accent-[var(--accent)]"
            onChange={(event) => setPreference("motion", event.target.checked)}
            type="checkbox"
          />
          <Sparkles aria-hidden="true" size={14} />Animations
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
  );
}
