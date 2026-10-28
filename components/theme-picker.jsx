"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

const themeOptions = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const selectedTheme = themeOptions.find((option) => option.value === theme) || themeOptions[0];
  const Icon = selectedTheme.icon;

  return (
    <label className="relative inline-flex shrink-0 items-center">
      <span className="sr-only">Color theme</span>
      <Icon aria-hidden="true" className="pointer-events-none absolute left-2.5 text-muted" size={14} />
      <select
        aria-label="Color theme"
        className="h-8 appearance-none rounded-full border border-border bg-surface py-1 pl-8 pr-3 text-[11px] font-medium text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-muted"
        onChange={(event) => setTheme(event.target.value)}
        value={theme}
      >
        {themeOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
