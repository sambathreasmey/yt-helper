"use client";

import { cn } from "@/lib/utils";
import { useLanguage, type AppLanguage } from "@/providers/language-provider";

const languages: { value: AppLanguage; label: string; translationKey: "languageKhmer" | "languageEnglish" | "languageChinese" }[] = [
  { value: "KH", label: "KH", translationKey: "languageKhmer" },
  { value: "EN", label: "EN", translationKey: "languageEnglish" },
  { value: "CN", label: "CN", translationKey: "languageChinese" },
];

export function LanguageSwitcher({ fullWidth = false }: { fullWidth?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      aria-label={t("language")}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-xl border border-border bg-surface-strong/80 p-1 shadow-inner",
        fullWidth && "grid w-full grid-cols-3",
      )}
      role="group"
    >
      {languages.map(({ value, label, translationKey }) => {
        const selected = language === value;
        return (
          <button
            aria-label={t(translationKey)}
            aria-pressed={selected}
            className={cn(
              "relative flex h-full min-w-9 items-center justify-center rounded-lg px-2.5 text-[11px] font-bold tracking-wide transition-all duration-200",
              selected
                ? "bg-accent-soft text-accent shadow-sm ring-1 ring-accent/20"
                : "text-muted hover:bg-surface hover:text-foreground",
              fullWidth && "w-full",
            )}
            key={value}
            onClick={() => setLanguage(value)}
            title={t(translationKey)}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
