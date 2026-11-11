"use client";

import { useState, type ComponentType, type CSSProperties } from "react";
import { Check, RotateCcw, Sparkles, WandSparkles, type LucideProps } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";
import { useGlobalAppSettings } from "@/hooks/use-global-app-settings";
import { ForceDeleteGoldPurchase } from "@/components/force-delete-gold-purchase";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  PRESETS,
  REFRESH_INTERVALS,
  isHexColor,
  type Appearance,
} from "@/providers/theme-config";
import {
  accents,
  animationSpeeds,
  animationStyles,
  appIcons,
  backgrounds,
  contentWidths,
  densities,
  layouts,
  optionGroups,
  performanceModes,
  presetLabelKeys,
  textSizes,
  themeModes,
  type SegmentOption,
} from "@/components/theme-picker-options";

const sectionLabel = "mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted";

type TabId = "style" | "layout" | "motion" | "live";

const tabs: { id: TabId; labelKey: TranslationKey }[] = [
  { id: "style", labelKey: "tabStyle" },
  { id: "layout", labelKey: "tabLayout" },
  { id: "motion", labelKey: "tabMotion" },
  { id: "live", labelKey: "tabLive" },
];

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  format,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  format?: (option: SegmentOption<T>) => string;
}) {
  const { t } = useLanguage();
  return (
    <fieldset className="mt-4">
      <legend className={sectionLabel}>{label}</legend>
      <div className="flex gap-1 rounded-2xl bg-surface p-1">
        {options.map((option) => (
          <button
            aria-pressed={value === option.value}
            className={cn(
              "flex min-h-9 flex-1 items-center justify-center rounded-xl px-2 text-[11px] font-medium text-muted transition-colors hover:text-foreground",
              value === option.value && "bg-surface-strong text-foreground shadow-sm",
            )}
            key={String(option.value)}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {format ? format(option) : t(option.labelKey)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function RangeField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="mb-2 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted">
        <span>{label}</span>
        <output className="rounded-full bg-accent-soft px-2 py-1 text-[10px] normal-case tracking-normal text-accent">
          {value}%
        </output>
      </legend>
      <input
        aria-label={label}
        aria-valuetext={`${value}%`}
        className="appearance-slider h-2 w-full cursor-pointer rounded-full bg-surface-strong"
        disabled={disabled}
        max="100"
        min="0"
        onChange={(event) => onChange(Number(event.target.value))}
        step="1"
        style={{ "--range-progress": `${value}%` } as CSSProperties}
        type="range"
        value={value}
      />
    </fieldset>
  );
}

function ToggleRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5 text-xs font-medium">
      <span>{label}</span>
      <input
        checked={checked}
        className="size-4 accent-[var(--accent)]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

export function ThemePanel({ activeModeIcon: ActiveModeIcon }: { activeModeIcon: ComponentType<LucideProps> }) {
  const { appearance, setPreference, applyPreset, resetAppearance } = useTheme();
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabId>("style");
  const globalSettingsQuery = useGlobalAppSettings();
  const set = (key: keyof Appearance) => (value: string | number | boolean) => setPreference(key, value);
  const modeLabels = {
    system: t("systemMode"),
    light: t("lightMode"),
    dark: t("darkMode"),
  };
  const groupLabels = {
    surface: t("cardStyle"),
    corners: t("cornerShape"),
  };
  const optionLabels = {
    glass: t("glassStyle"),
    solid: t("solidStyle"),
    soft: t("softCorners"),
    rounded: t("roundCorners"),
    sharp: t("sharpCorners"),
  };
  const optionLabelFor = (value: string): string => {
    if (value === "glass") return optionLabels.glass;
    if (value === "solid") return optionLabels.solid;
    if (value === "soft") return optionLabels.soft;
    if (value === "rounded") return optionLabels.rounded;
    if (value === "sharp") return optionLabels.sharp;
    return value;
  };

  return (
    <section
      aria-label={t("customize")}
      className="appearance-panel glass absolute right-0 top-[calc(100%+10px)] z-50 max-h-[min(80vh,42rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl p-4 shadow-2xl"
      role="dialog"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-strong text-accent">
            <WandSparkles aria-hidden="true" size={17} />
          </span>
          <div>
            <h2 className="text-sm font-semibold">{t("customizeTitle")}</h2>
            <p className="mt-1 text-xs text-muted">{t("customizeDescription")}</p>
          </div>
        </div>
        <span className="mt-1 text-muted" aria-hidden="true"><ActiveModeIcon size={15} /></span>
      </div>

      <div className="sticky top-0 z-10 -mx-1 mb-1 flex gap-1 rounded-2xl bg-surface-strong p-1 backdrop-blur" role="tablist">
        {tabs.map(({ id, labelKey }) => (
          <button
            aria-selected={tab === id}
            className={cn(
              "flex min-h-9 flex-1 items-center justify-center rounded-xl px-1 text-[11px] font-semibold text-muted transition-colors hover:text-foreground",
              tab === id && "bg-accent-soft text-accent shadow-sm",
            )}
            key={id}
            onClick={() => setTab(id)}
            role="tab"
            type="button"
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {tab === "style" && (
        <div role="tabpanel">
          <fieldset className="mt-4">
            <legend className={sectionLabel}>{t("presets")}</legend>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  className="min-h-10 rounded-xl border border-border bg-surface px-1 text-[10px] font-semibold text-muted transition hover:border-accent/50 hover:text-foreground active:scale-95"
                  key={preset.id}
                  onClick={() => applyPreset(preset.values)}
                  type="button"
                >
                  {t(presetLabelKeys[preset.id])}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className={sectionLabel}>{t("language")}</legend>
            <LanguageSwitcher fullWidth />
          </fieldset>

          {globalSettingsQuery.data?.support_url && (
            <a
              className="theme-support-link"
              href={globalSettingsQuery.data.support_url}
              rel="noreferrer"
              target="_blank"
            >
              {t("support")}
            </a>
          )}

          <ForceDeleteGoldPurchase />

          <fieldset className="mt-4">
            <legend className={sectionLabel}>{t("accentColor")}</legend>
            <div className="grid grid-cols-7 gap-2">
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
              <label
                className={cn(
                  "relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-transparent transition-transform hover:scale-110 focus-within:ring-2 focus-within:ring-muted",
                  appearance.accent === "custom" && "border-foreground",
                )}
                style={{
                  background: appearance.accent === "custom"
                    ? appearance.customAccent
                    : "conic-gradient(#f87171, #fbbf24, #4ade80, #38bdf8, #a78bfa, #f472b6, #f87171)",
                }}
                title={t("customColor")}
              >
                <span className="sr-only">{t("customColor")}</span>
                <input
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  onChange={(event) => {
                    if (isHexColor(event.target.value)) setPreference("customAccent", event.target.value);
                  }}
                  type="color"
                  value={appearance.customAccent}
                />
                {appearance.accent === "custom" && <Check aria-hidden="true" className="pointer-events-none text-white drop-shadow" size={16} />}
              </label>
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className={sectionLabel}>{t("appearance")}</legend>
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1">
              {themeModes.map(({ value, icon: Icon }) => (
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
                  <Icon aria-hidden="true" size={14} />{modeLabels[value]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className={sectionLabel}>{t("appIcon")}</legend>
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
            <legend className={sectionLabel}>{t("backgroundStyles")}</legend>
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
          <RangeField
            disabled={appearance.background === "none"}
            label={t("backgroundIntensity")}
            onChange={set("backgroundIntensity")}
            value={appearance.backgroundIntensity}
          />
        </div>
      )}

      {tab === "layout" && (
        <div role="tabpanel">
          <fieldset className="mt-4">
            <legend className={sectionLabel}>{t("pageLayout")}</legend>
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

          <Segmented label={t("contentWidth")} onChange={set("contentWidth")} options={contentWidths} value={appearance.contentWidth} />
          <Segmented label={t("density")} onChange={set("density")} options={densities} value={appearance.density} />
          <Segmented label={t("textSize")} onChange={set("textSize")} options={textSizes} value={appearance.textSize} />

          {optionGroups.map((group) => (
            <fieldset className="mt-4 flex items-center justify-between gap-3" key={group.key}>
              <legend className="sr-only">{groupLabels[group.key]}</legend>
              <span className="text-xs font-medium">{groupLabels[group.key]}</span>
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
                    {optionLabelFor(option.value) || option.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}

          <RangeField
            disabled={appearance.surface === "solid" || appearance.performance === "lite"}
            label={t("glassBlur")}
            onChange={set("blur")}
            value={appearance.blur}
          />
          <p className="mt-1 text-[10px] text-muted">
            {appearance.surface === "solid" ? t("chooseGlass") : t("adjustGlass")}
          </p>
        </div>
      )}

      {tab === "motion" && (
        <div role="tabpanel">
          <ToggleRow checked={appearance.motion} label={t("animations")} onChange={set("motion")} />

          <fieldset className="mt-4">
            <legend className={sectionLabel}>{t("animationStyle")}</legend>
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

          <Segmented label={t("animationSpeed")} onChange={set("animationSpeed")} options={animationSpeeds} value={appearance.animationSpeed} />
          <ToggleRow checked={appearance.haptics} label={t("hapticFeedback")} onChange={set("haptics")} />
        </div>
      )}

      {tab === "live" && (
        <div role="tabpanel">
          <Segmented
            format={(option) => (option.value === 0 ? t("refreshOff") : t("refreshSeconds", { seconds: option.value }))}
            label={t("liveRefresh")}
            onChange={set("refreshInterval")}
            options={REFRESH_INTERVALS.map((value) => ({ value, labelKey: "refreshOff" as const }))}
            value={appearance.refreshInterval}
          />
          <ToggleRow checked={appearance.priceAnimation} label={t("priceAnimation")} onChange={set("priceAnimation")} />
          <Segmented label={t("performanceMode")} onChange={set("performance")} options={performanceModes} value={appearance.performance} />
          <p className="mt-1.5 text-[10px] leading-relaxed text-muted">{t("perfHint")}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <Sparkles aria-hidden="true" size={13} />
          {t("customizeTitle")}
        </span>
        <button
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
          onClick={resetAppearance}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={13} />{t("reset")}
        </button>
      </div>
    </section>
  );
}
