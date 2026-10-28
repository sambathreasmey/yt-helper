import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeHero({ countdown, onOpenYouTube, language = "en" }) {
  const isKhmer = language === "km";
  const subtitle = countdown === null
    ? (isKhmer ? "បើក YouTube ដោយផ្ទាល់" : "Browse YouTube directly")
    : isKhmer
      ? `បើកក្នុង ${countdown} វិនាទី · ចុចកន្លែងផ្សេងដើម្បីបោះបង់`
      : `Opening in ${countdown}s · tap anywhere else to cancel`;

  return (
    <Button
      aria-label={isKhmer ? "បើក YouTube" : "Open YouTube"}
      className="relative mb-3 flex min-h-[138px] w-full flex-col items-start justify-center gap-2 overflow-hidden rounded-[24px] border border-border bg-[linear-gradient(120deg,#292a2d,#1d1e20_72%,#17181a)] px-6 text-left text-white shadow-[0_14px_36px_rgb(0_0_0_/_24%)] hover:bg-[linear-gradient(120deg,#292a2d,#1d1e20_72%,#17181a)] hover:shadow-[0_18px_42px_rgb(0_0_0_/_32%)]"
      data-countdown-trigger
      onClick={onOpenYouTube}
      type="button"
      variant="secondary"
    >
      {countdown !== null && (
        <span
          className="absolute inset-y-0 left-0 z-0 bg-black/20"
          key="countdown-progress"
          style={{ animation: "countdown-fill 3s linear forwards" }}
        />
      )}
      <span className="relative z-10 flex items-center gap-3 text-2xl font-bold tracking-tight">
        <Play aria-hidden="true" className="fill-current text-accent" size={27} />
        {isKhmer ? "បើក YouTube" : "Open YouTube"}
      </span>
      <span className="relative z-10 min-h-4 pl-10 text-xs font-medium text-white/75">{subtitle}</span>
    </Button>
  );
}
