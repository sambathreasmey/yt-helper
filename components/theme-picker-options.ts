import type { ComponentType } from "react";
import {
  Clapperboard,
  CirclePlay,
  Cloud,
  Droplets,
  Flower2,
  Grid2X2,
  Heart,
  Film,
  Headphones,
  LayoutDashboard,
  Monitor,
  MoonStar,
  Moon,
  Orbit,
  PanelsTopLeft,
  Play,
  Rows3,
  Shapes,
  Sparkles,
  Stars,
  Sun,
  Waves,
  Wind,
  CircleOff,
  Blend,
  CircleDot,
  Grid3X3,
  Maximize2,
  type LucideProps,
} from "lucide-react";
import type { Appearance } from "@/providers/theme-config";
import type { TranslationKey } from "@/providers/language-provider";

export type IconComponent = ComponentType<LucideProps>;

export interface IconOption<T extends string> {
  value: T;
  label: string;
  icon: IconComponent;
}

export const themeModes: IconOption<Appearance["mode"]>[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export const accents: { value: Appearance["accent"]; label: string; color: string }[] = [
  { value: "neutral", label: "Stone", color: "#a1a1aa" },
  { value: "rose", label: "Rose", color: "#ec7892" },
  { value: "lavender", label: "Lavender", color: "#aa85ed" },
  { value: "mint", label: "Mint", color: "#5fc4a3" },
  { value: "ocean", label: "Ocean", color: "#69a9e3" },
  { value: "peach", label: "Peach", color: "#efa276" },
];

export const appIcons: IconOption<Appearance["appIcon"]>[] = [
  { value: "circle-play", label: "Circle play", icon: CirclePlay },
  { value: "play", label: "Play", icon: Play },
  { value: "film", label: "Film", icon: Film },
  { value: "clapperboard", label: "Clapperboard", icon: Clapperboard },
  { value: "headphones", label: "Headphones", icon: Headphones },
];

export const backgrounds: IconOption<Appearance["background"]>[] = [
  { value: "aurora", label: "Aurora", icon: Waves },
  { value: "drift", label: "Drift", icon: Wind },
  { value: "cute", label: "Cute", icon: Sparkles },
  { value: "petals", label: "Petals", icon: Flower2 },
  { value: "bubbles", label: "Bubbles", icon: Droplets },
  { value: "stars", label: "Starlight", icon: Stars },
  { value: "clouds", label: "Clouds", icon: Cloud },
  { value: "confetti", label: "Confetti", icon: Shapes },
  { value: "hearts", label: "Hearts", icon: Heart },
  { value: "waves", label: "Waves", icon: Waves },
  { value: "galaxy", label: "Galaxy", icon: MoonStar },
  { value: "mesh", label: "Mesh", icon: Blend },
  { value: "grid", label: "Grid", icon: Grid3X3 },
  { value: "dots", label: "Dots", icon: CircleDot },
  { value: "none", label: "None", icon: CircleOff },
];

export const animationStyles: IconOption<Appearance["animationStyle"]>[] = [
  { value: "float", label: "Float", icon: Wind },
  { value: "breathe", label: "Breathe", icon: Cloud },
  { value: "twinkle", label: "Twinkle", icon: Sparkles },
  { value: "orbit", label: "Orbit", icon: Orbit },
  { value: "wave", label: "Wave", icon: Waves },
  { value: "none", label: "Still", icon: CircleOff },
];

export const layouts: IconOption<Appearance["layout"]>[] = [
  { value: "stacked", label: "Classic", icon: Rows3 },
  { value: "compact", label: "Compact", icon: PanelsTopLeft },
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "gallery", label: "Gallery", icon: Grid2X2 },
  { value: "focus", label: "Focus", icon: Maximize2 },
];

export type OptionGroupKey = "surface" | "corners";

export const optionGroups: {
  key: OptionGroupKey;
  label: string;
  options: { value: string; label: string }[];
}[] = [
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

export interface SegmentOption<T extends string | number> {
  value: T;
  labelKey: TranslationKey;
}

export const animationSpeeds: SegmentOption<Appearance["animationSpeed"]>[] = [
  { value: "slow", labelKey: "speedSlow" },
  { value: "normal", labelKey: "speedNormal" },
  { value: "fast", labelKey: "speedFast" },
];

export const contentWidths: SegmentOption<Appearance["contentWidth"]>[] = [
  { value: "narrow", labelKey: "widthNarrow" },
  { value: "normal", labelKey: "widthNormal" },
  { value: "wide", labelKey: "widthWide" },
];

export const densities: SegmentOption<Appearance["density"]>[] = [
  { value: "comfortable", labelKey: "densityComfortable" },
  { value: "compact", labelKey: "densityCompact" },
];

export const textSizes: SegmentOption<Appearance["textSize"]>[] = [
  { value: "small", labelKey: "textSmall" },
  { value: "medium", labelKey: "textMedium" },
  { value: "large", labelKey: "textLarge" },
];

export const performanceModes: SegmentOption<Appearance["performance"]>[] = [
  { value: "auto", labelKey: "perfAuto" },
  { value: "full", labelKey: "perfFull" },
  { value: "lite", labelKey: "perfLite" },
];

export const presetLabelKeys = {
  midnight: "presetMidnight",
  blossom: "presetBlossom",
  minimal: "presetMinimal",
  speed: "presetSpeed",
} as const satisfies Record<string, TranslationKey>;
