"use client";

import { cn } from "@/lib/utils";

interface SheetTabsProps<T extends string> {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Full-width segmented tabs for splitting a long form inside a bottom sheet. */
export function SheetTabs<T extends string>({ tabs, value, onChange, className }: SheetTabsProps<T>) {
  return (
    <div className={cn("gold-tabs sheet-tabs", className)} role="tablist">
      {tabs.map((tab) => (
        <button
          aria-selected={value === tab.id}
          className="gold-tab"
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
