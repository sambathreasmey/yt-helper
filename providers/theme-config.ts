export type ThemeMode = "system" | "light" | "dark";
export type Accent = "neutral" | "rose" | "lavender" | "mint" | "ocean" | "peach" | "custom";
export type Surface = "glass" | "solid";
export type Corners = "soft" | "rounded" | "sharp";
export type Background =
  | "aurora" | "drift" | "cute" | "petals" | "bubbles" | "stars"
  | "clouds" | "confetti" | "hearts" | "waves" | "galaxy"
  | "mesh" | "grid" | "dots" | "none";
export type AnimationStyle = "float" | "breathe" | "twinkle" | "orbit" | "wave" | "none";
export type Layout = "stacked" | "compact" | "dashboard" | "gallery" | "focus";
export type AppIcon = "circle-play" | "play" | "film" | "clapperboard" | "headphones";
export type TextSize = "small" | "medium" | "large";
export type Density = "comfortable" | "compact";
export type ContentWidth = "narrow" | "normal" | "wide";
export type AnimationSpeed = "slow" | "normal" | "fast";
export type PerformanceMode = "auto" | "full" | "lite";
/** Seconds between live gold price refreshes. 0 turns automatic refresh off. */
export type RefreshInterval = 0 | 15 | 30 | 60;

export interface Appearance {
  mode: ThemeMode;
  accent: Accent;
  customAccent: string;
  surface: Surface;
  corners: Corners;
  blur: number;
  background: Background;
  backgroundIntensity: number;
  animationStyle: AnimationStyle;
  animationSpeed: AnimationSpeed;
  layout: Layout;
  contentWidth: ContentWidth;
  density: Density;
  textSize: TextSize;
  appIcon: AppIcon;
  motion: boolean;
  performance: PerformanceMode;
  refreshInterval: RefreshInterval;
  priceAnimation: boolean;
  haptics: boolean;
}

export const STORAGE_KEY = "yt-helper-appearance";
export const LEGACY_STORAGE_KEY = "yt-helper-theme";

export const REFRESH_INTERVALS: readonly RefreshInterval[] = [15, 30, 60, 0];

export const DEFAULT_APPEARANCE: Appearance = {
  mode: "dark",
  accent: "mint",
  customAccent: "#80dfc0",
  surface: "glass",
  corners: "soft",
  blur: 70,
  background: "aurora",
  backgroundIntensity: 100,
  animationStyle: "float",
  animationSpeed: "normal",
  layout: "stacked",
  contentWidth: "normal",
  density: "comfortable",
  textSize: "medium",
  appIcon: "circle-play",
  motion: true,
  performance: "auto",
  refreshInterval: 15,
  priceAnimation: true,
  haptics: true,
};

export const ACCENTS: Record<Exclude<Accent, "custom">, { light: string; dark: string }> = {
  neutral: { light: "#27272a", dark: "#e4e4e7" },
  rose: { light: "#be526c", dark: "#f29ab0" },
  lavender: { light: "#7657b7", dark: "#c5a6ff" },
  mint: { light: "#24775f", dark: "#80dfc0" },
  ocean: { light: "#3975ad", dark: "#8ec7ff" },
  peach: { light: "#b86b43", dark: "#ffb489" },
};

export const TEXT_SCALE: Record<TextSize, string> = {
  small: "15px",
  medium: "16px",
  large: "17.5px",
};

export const ANIMATION_SPEED: Record<AnimationSpeed, number> = {
  slow: 1.6,
  normal: 1,
  fast: 0.6,
};

export const VALID_OPTIONS: Record<string, readonly string[]> = {
  mode: ["system", "light", "dark"],
  accent: ["neutral", "rose", "lavender", "mint", "ocean", "peach", "custom"],
  surface: ["glass", "solid"],
  corners: ["soft", "rounded", "sharp"],
  background: [
    "aurora", "drift", "cute", "petals", "bubbles", "stars",
    "clouds", "confetti", "hearts", "waves", "galaxy", "mesh", "grid", "dots", "none",
  ],
  animationStyle: ["float", "breathe", "twinkle", "orbit", "wave", "none"],
  animationSpeed: ["slow", "normal", "fast"],
  layout: ["stacked", "compact", "dashboard", "gallery", "focus"],
  contentWidth: ["narrow", "normal", "wide"],
  density: ["comfortable", "compact"],
  textSize: ["small", "medium", "large"],
  appIcon: ["circle-play", "play", "film", "clapperboard", "headphones"],
  performance: ["auto", "full", "lite"],
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

export function isRefreshInterval(value: unknown): value is RefreshInterval {
  return value === 0 || value === 15 || value === 30 || value === 60;
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Quick-start looks that change several preferences in one tap. */
export const PRESETS: { id: "midnight" | "blossom" | "minimal" | "speed"; values: Partial<Appearance> }[] = [
  {
    id: "midnight",
    values: {
      mode: "dark", accent: "ocean", background: "galaxy", animationStyle: "twinkle",
      surface: "glass", corners: "soft", density: "comfortable", performance: "auto",
    },
  },
  {
    id: "blossom",
    values: {
      mode: "light", accent: "rose", background: "petals", animationStyle: "float",
      surface: "glass", corners: "rounded", density: "comfortable", performance: "auto",
    },
  },
  {
    id: "minimal",
    values: {
      mode: "system", accent: "neutral", background: "none", animationStyle: "none",
      surface: "solid", corners: "sharp", density: "compact", performance: "auto",
    },
  },
  {
    id: "speed",
    values: {
      background: "none", animationStyle: "none", surface: "solid", performance: "lite",
      animationSpeed: "fast",
    },
  },
];

function mixWithBlack(hex: string, amount: number): string {
  const number = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(((number >> shift) & 255) * (1 - amount)).toString(16).padStart(2, "0");
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/** The accent colour to paint for the resolved light/dark theme. */
export function resolveAccentColor(appearance: Appearance, theme: "light" | "dark"): string {
  if (appearance.accent === "custom") {
    return theme === "light" ? mixWithBlack(appearance.customAccent, 0.28) : appearance.customAccent;
  }
  const accent = ACCENTS[appearance.accent] || ACCENTS.neutral;
  return theme === "light" ? accent.light : accent.dark;
}

/**
 * Weak devices get the lighter rendering path when performance is "auto":
 * 2 GB of memory or less, 2 cores or fewer, or a touch device with 4 cores or fewer.
 * Desktop machines with 4 cores keep the full effects.
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const hasCores = typeof cores === "number" && cores > 0;
  const touch = navigator.maxTouchPoints > 0;
  return (typeof memory === "number" && memory <= 2)
    || (hasCores && cores <= 2)
    || (touch && hasCores && cores <= 4);
}

export function readAppearance(): Appearance {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return DEFAULT_APPEARANCE;
      const record = parsed as Record<string, unknown>;
      const validated: Record<string, unknown> = {};
      for (const [key, values] of Object.entries(VALID_OPTIONS)) {
        if (values.includes(record[key] as string)) validated[key] = record[key];
      }
      const percent = (value: unknown, fallback: number) =>
        typeof value === "number" && Number.isFinite(value) ? clampPercent(value) : fallback;
      const flag = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);
      return {
        ...DEFAULT_APPEARANCE,
        ...validated,
        customAccent: isHexColor(record.customAccent) ? record.customAccent : DEFAULT_APPEARANCE.customAccent,
        blur: percent(record.blur, DEFAULT_APPEARANCE.blur),
        backgroundIntensity: percent(record.backgroundIntensity, DEFAULT_APPEARANCE.backgroundIntensity),
        refreshInterval: isRefreshInterval(record.refreshInterval)
          ? record.refreshInterval
          : DEFAULT_APPEARANCE.refreshInterval,
        motion: flag(record.motion, DEFAULT_APPEARANCE.motion),
        priceAnimation: flag(record.priceAnimation, DEFAULT_APPEARANCE.priceAnimation),
        haptics: flag(record.haptics, DEFAULT_APPEARANCE.haptics),
      } as Appearance;
    }

    const legacyMode = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyMode && VALID_OPTIONS.mode.includes(legacyMode)) {
      return { ...DEFAULT_APPEARANCE, mode: legacyMode as ThemeMode };
    }
  } catch {
    return DEFAULT_APPEARANCE;
  }
  return DEFAULT_APPEARANCE;
}
