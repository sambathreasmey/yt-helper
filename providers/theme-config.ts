export type ThemeMode = "system" | "light" | "dark";
export type Accent = "neutral" | "rose" | "lavender" | "mint" | "ocean" | "peach";
export type Surface = "glass" | "solid";
export type Corners = "soft" | "rounded" | "sharp";
export type Background =
  | "aurora" | "drift" | "cute" | "petals" | "bubbles" | "stars"
  | "clouds" | "confetti" | "hearts" | "waves" | "galaxy" | "none";
export type AnimationStyle = "float" | "breathe" | "twinkle" | "orbit" | "wave" | "none";
export type Layout = "stacked" | "compact" | "dashboard" | "gallery";
export type AppIcon = "circle-play" | "play" | "film" | "clapperboard" | "headphones";

export interface Appearance {
  mode: ThemeMode;
  accent: Accent;
  surface: Surface;
  corners: Corners;
  blur: number;
  background: Background;
  animationStyle: AnimationStyle;
  layout: Layout;
  appIcon: AppIcon;
  motion: boolean;
}

export const STORAGE_KEY = "yt-helper-appearance";
export const LEGACY_STORAGE_KEY = "yt-helper-theme";

export const DEFAULT_APPEARANCE: Appearance = {
  mode: "system",
  accent: "neutral",
  surface: "glass",
  corners: "soft",
  blur: 70,
  background: "aurora",
  animationStyle: "float",
  layout: "stacked",
  appIcon: "circle-play",
  motion: true,
};

export const ACCENTS: Record<Accent, { light: string; dark: string }> = {
  neutral: { light: "#27272a", dark: "#e4e4e7" },
  rose: { light: "#be526c", dark: "#f29ab0" },
  lavender: { light: "#7657b7", dark: "#c5a6ff" },
  mint: { light: "#26836b", dark: "#7ed8ba" },
  ocean: { light: "#3975ad", dark: "#8ec7ff" },
  peach: { light: "#b86b43", dark: "#ffb489" },
};

export const VALID_OPTIONS: Record<string, readonly string[]> = {
  mode: ["system", "light", "dark"],
  accent: ["neutral", "rose", "lavender", "mint", "ocean", "peach"],
  surface: ["glass", "solid"],
  corners: ["soft", "rounded", "sharp"],
  background: [
    "aurora", "drift", "cute", "petals", "bubbles", "stars",
    "clouds", "confetti", "hearts", "waves", "galaxy", "none",
  ],
  animationStyle: ["float", "breathe", "twinkle", "orbit", "wave", "none"],
  layout: ["stacked", "compact", "dashboard", "gallery"],
  appIcon: ["circle-play", "play", "film", "clapperboard", "headphones"],
};

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
      return {
        ...DEFAULT_APPEARANCE,
        ...validated,
        blur: typeof record.blur === "number" && Number.isFinite(record.blur)
          ? Math.min(100, Math.max(0, Math.round(record.blur)))
          : DEFAULT_APPEARANCE.blur,
        motion: typeof record.motion === "boolean" ? record.motion : DEFAULT_APPEARANCE.motion,
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
