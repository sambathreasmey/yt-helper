import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/providers/language-provider";

interface HomeHeroProps {
  countdown: number | null;
  countdownDurationSeconds: number;
  onOpenYouTube: () => void;
}

export function HomeHero({ countdown, countdownDurationSeconds, onOpenYouTube }: HomeHeroProps) {
  const { t } = useLanguage();
  const subtitle = countdown === null
    ? t("browseYouTube")
    : t("openingIn", { seconds: countdown });

  return (
    <Button
      aria-label={t("openYouTube")}
      className="youtube-hero relative mb-3 flex min-h-[172px] w-full flex-col items-start justify-center gap-3 overflow-hidden rounded-[28px] border border-border px-5 py-5 text-left text-white"
      data-countdown-trigger
      data-layout-slot="hero"
      onClick={onOpenYouTube}
      type="button"
      variant="secondary"
    >
      {countdown !== null && (
        <span
          className="countdown-progress absolute inset-y-0 left-0 z-0"
          key="countdown-progress"
          style={{ animation: `countdown-fill ${countdownDurationSeconds}s linear forwards` }}
        />
      )}
      {countdown !== null && (
        <span aria-label={`${countdown} ${t("seconds")}`} aria-live="polite" className="countdown-orbit absolute right-5 top-5 z-10 grid size-14 place-items-center rounded-full" role="timer">
          <span className="countdown-orbit-ring absolute inset-0 rounded-full" />
          <span className="countdown-digit relative text-2xl font-bold tabular-nums" key={countdown}>{countdown}</span>
          <span className="absolute -bottom-1 rounded-full border border-white/10 bg-black/40 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-white/70">{t("seconds")}</span>
        </span>
      )}
      <span className="youtube-hero-copy relative z-10 flex min-w-0 items-center gap-3">
        <span className="youtube-hero-logo grid size-[4.25rem] shrink-0 place-items-center rounded-[1.35rem]">
          <Play aria-hidden="true" className="fill-current" size={39} strokeWidth={1.7} />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-extrabold tracking-tight">{t("openYouTube")}</span>
          <span className={`mt-1 block min-h-4 text-xs font-medium leading-relaxed text-white/75 ${countdown !== null ? "pr-14" : ""}`}>
            {subtitle}
          </span>
        </span>
      </span>
      <span className="youtube-hero-action relative z-10 ml-[4.9rem] inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold">
        <Play aria-hidden="true" className="fill-current" size={17} />
        <span>{t("openYouTube")}</span>
        <ArrowRight aria-hidden="true" size={16} />
      </span>
      <span aria-hidden="true" className="youtube-hero-decoration">
        <Play className="fill-current" size={104} />
      </span>
    </Button>
  );
}
