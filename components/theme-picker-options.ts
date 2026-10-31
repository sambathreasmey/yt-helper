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
  type LucideProps,
} from "lucide-react";
import type { Appearance } from "@/providers/theme-config";

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
