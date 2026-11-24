"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Activity,
  BellRing,
  Check,
  ChevronDown,
  CirclePlay,
  LayoutGrid,
  Maximize,
  Minimize,
  Play,
  Scale,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { GoldIcon } from "@/components/icons/gold-icon";
import { GoldBullionArt } from "@/components/gold-bullion-art";
import { LanguageSwitcher } from "@/components/language-switcher";
import { WelcomeBannerDemo } from "@/components/welcome-banner-demo";
import { BOT_LINK, StickyTelegramCta, TelegramCta } from "@/components/landing/telegram-cta";
import { useReveal } from "@/components/landing/use-reveal";
import { AnimatedNumber } from "@/components/animated-number";
import { LiveTicker, type TickerPoint } from "@/components/live-ticker";
import { useLiveGoldFeed } from "@/hooks/use-live-gold-feed";
import { formatUsd } from "@/features/gold-trading/gold-format";
import { useLanguage, type TranslationKey } from "@/providers/language-provider";
import { cn } from "@/lib/utils";

const STICKY_WATCH = ["landing-hero-cta", "landing-final-cta"];

function scrollToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

function SectionHeading({ id, eyebrow, title, className }: { id?: string; eyebrow?: string; title: string; className?: string }) {
  return (
    <div className={cn("landing-heading reveal", className)}>
      {eyebrow && <p className="landing-eyebrow">{eyebrow}</p>}
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function LandingHeader() {
  const { t } = useLanguage();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.dataset.scrolled = window.scrollY > 12 ? "true" : "false";
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const links: { id: string; label: TranslationKey }[] = [
    { id: "market", label: "navLiveMarket" },
    { id: "features", label: "navFeatures" },
    { id: "how-it-works", label: "navHowItWorks" },
    { id: "faq", label: "navFaq" },
  ];

  return (
    <header className="landing-header" data-scrolled="false" ref={headerRef}>
      <div className="landing-header-inner">
        <a className="landing-brand" href="#top" onClick={(event) => scrollToSection(event, "top")}>
          <Image
            alt=""
            className="landing-brand-logo"
            height={128}
            priority
            src="/logo-128.webp"
            width={128}
          />
          <span className="landing-brand-name">Helper Mini App</span>
        </a>
        <nav aria-label="Sections" className="landing-nav">
          {links.map((link) => (
            <a href={`#${link.id}`} key={link.id} onClick={(event) => scrollToSection(event, link.id)}>
              {t(link.label)}
            </a>
          ))}
        </nav>
        <div className="landing-header-actions">
          <LanguageSwitcher />
          {BOT_LINK && <TelegramCta className="landing-header-cta" size="md" />}
        </div>
      </div>
    </header>
  );
}

function PhoneMock() {
  const { t } = useLanguage();
  const features = [
    { id: "gold", icon: <GoldIcon size={20} />, title: t("goldTrading"), detail: t("goldFeature1") },
    { id: "youtube", icon: <CirclePlay size={20} />, title: t("youtubeTitle"), detail: t("youtubeFeature1") },
    { id: "alerts", icon: <BellRing size={20} />, title: t("priceAlerts"), detail: t("goldFeature4") },
    { id: "live", icon: <Activity size={20} />, title: t("landingLiveAvailability"), detail: t("goldFeature5") },
  ];
  const slides = [...features, { ...features[0], id: "gold-loop" }];

  return (
    <div aria-hidden={false} className="landing-visual">
      <div aria-hidden="true" className="landing-glow" />
      <div className="landing-phone">
        <span aria-hidden="true" className="landing-phone-notch" />
        <div aria-label={t("landingPhoneAlt")} className="landing-phone-screen" role="img">
          <div aria-hidden="true" className="landing-phone-appbar">
            <span className="landing-phone-app-mark">H</span>
            <strong>Helper</strong>
            <span className="landing-phone-live"><i />{t("liveBadge")}</span>
          </div>
          <div className="landing-phone-feature-window">
            <div className="landing-phone-feature-track">
              {slides.map((feature, index) => (
                <div
                  aria-hidden={index === features.length ? true : undefined}
                  className="landing-phone-feature-slide"
                  key={feature.id}
                >
                  <span className="landing-phone-slide-icon">{feature.icon}</span>
                  <strong>{feature.title}</strong>
                  <p>{feature.detail}</p>
                  {feature.id === "youtube" ? (
                    <div className="landing-phone-preview landing-phone-preview-video">
                      <span><CirclePlay aria-hidden="true" size={27} /></span>
                      <i />
                      <i />
                    </div>
                  ) : feature.id === "alerts" ? (
                    <div className="landing-phone-preview landing-phone-preview-alert">
                      <BellRing aria-hidden="true" size={19} />
                      <span><i /><i /></span>
                    </div>
                  ) : (
                    <div className="landing-phone-preview landing-phone-preview-chart">
                      <span><i />{t("liveBadge")}</span>
                      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 160 52">
                        <path d="M2 42 23 35 40 39 61 24 78 30 100 16 119 22 139 8 158 12" />
                      </svg>
                    </div>
                  )}
                  <small>{`${(index % features.length) + 1} / ${features.length}`}</small>
                </div>
              ))}
            </div>
          </div>
          <div aria-hidden="true" className="landing-phone-bottom-bar"><i /><i /><i /></div>
        </div>
      </div>
      {features.map((feature, index) => (
        <div
          aria-hidden="true"
          className={`landing-orbit-chip landing-orbit-chip-${index + 1}`}
          key={feature.id}
        >
          <span className="landing-orbit-chip-icon">{feature.icon}</span>
          <span>{feature.title}</span>
          {feature.id === "gold" && <span className="landing-live"><i />{t("liveBadge")}</span>}
        </div>
      ))}
    </div>
  );
}

function Hero() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="landing-title" className="landing-hero">
      <div className="landing-hero-copy">
        <p className="landing-pill reveal">
          <Sparkles aria-hidden="true" size={14} />
          {t("welcomeEyebrow")}
        </p>
        <h1 className="landing-title reveal" id="landing-title" style={{ "--d": "60ms" } as React.CSSProperties}>
          {t("welcomeTitle")}
        </h1>
        <p className="landing-lead reveal" style={{ "--d": "120ms" } as React.CSSProperties}>
          {t("welcomeDescription")}
        </p>
        <div className="landing-actions reveal" style={{ "--d": "180ms" } as React.CSSProperties}>
          <TelegramCta hint id="landing-hero-cta" />
          <a className="landing-secondary" href="#demo" onClick={(event) => scrollToSection(event, "demo")}>
            <Play aria-hidden="true" fill="currentColor" size={15} />
            {t("homeGuideTitle")}
          </a>
        </div>
        <ul className="landing-trust reveal" style={{ "--d": "240ms" } as React.CSSProperties}>
          <li><Check aria-hidden="true" size={14} />{t("trustTelegram")}</li>
          <li><Check aria-hidden="true" size={14} />{t("trustNoInstall")}</li>
          <li><Check aria-hidden="true" size={14} />{t("trustLanguages")}</li>
        </ul>
      </div>
      <PhoneMock />
    </section>
  );
}

type MarketUnit = "damlung" | "chi" | "hun";

const MARKET_UNITS: { id: MarketUnit; label: TranslationKey; divisor: number }[] = [
  { id: "damlung", label: "damlungUnit", divisor: 1 },
  { id: "chi", label: "chiUnit", divisor: 10 },
  { id: "hun", label: "hunUnit", divisor: 100 },
];

function LandingMarket() {
  const { t, locale } = useLanguage();
  const feed = useLiveGoldFeed(true);
  const marketCardRef = useRef<HTMLDivElement>(null);
  const [unit, setUnit] = useState<MarketUnit>("damlung");
  const [windowSize, setWindowSize] = useState<"1m" | "2m">("2m");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenUnavailable, setFullscreenUnavailable] = useState(false);
  const [prices, setPrices] = useState<TickerPoint[]>([]);
  const [activity, setActivity] = useState<TickerPoint[]>([]);
  const activityListRef = useRef<HTMLOListElement>(null);
  const activityPositions = useRef(new Map<string, number>());
  const [startPrice, setStartPrice] = useState<number | null>(null);
  const [range, setRange] = useState<{ high: number; low: number } | null>(null);
  const formatPrice = useCallback((value: number) => formatUsd(String(value), locale), [locale]);

  useEffect(() => {
    const syncFullscreen = () => {
      const active = document.fullscreenElement === marketCardRef.current;
      setIsFullscreen(active);
      if (active) setFullscreenUnavailable(false);
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    const card = marketCardRef.current;
    if (!card) return;
    setFullscreenUnavailable(false);
    try {
      if (document.fullscreenElement === card) {
        await document.exitFullscreen();
      } else if (!document.fullscreenEnabled || typeof card.requestFullscreen !== "function") {
        setFullscreenUnavailable(true);
      } else {
        await card.requestFullscreen({ navigationUI: "hide" });
      }
    } catch {
      setFullscreenUnavailable(true);
    }
  };

  useEffect(() => {
    const price = feed.price;
    if (price === null) return;
    setPrices((current) => {
      const last = current[current.length - 1];
      const at = feed.updatedAt ?? Date.now();
      if (last && at - last.t < 1_000) {
        return [...current.slice(0, -1), { t: last.t, p: price }];
      }
      return [...current, { t: at, p: price }].slice(-240);
    });
    setActivity((current) => [...current, { t: feed.updatedAt ?? Date.now(), p: price }].slice(-4));
    setStartPrice((current) => current ?? price);
    setRange((current) => ({
      high: current ? Math.max(current.high, price) : price,
      low: current ? Math.min(current.low, price) : price,
    }));
  }, [feed.price, feed.updatedAt]);

  useLayoutEffect(() => {
    const list = activityListRef.current;
    if (!list) return;

    const root = document.documentElement;
    const canAnimate = root.dataset.motion !== "off"
      && root.dataset.perf !== "lite"
      && root.dataset.paused !== "true"
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextPositions = new Map<string, number>();

    for (const item of Array.from(list.children)) {
      if (!(item instanceof HTMLLIElement)) continue;
      const key = item.dataset.activityKey;
      if (!key) continue;

      const top = item.getBoundingClientRect().top;
      nextPositions.set(key, top);
      if (!canAnimate) continue;

      const previousTop = activityPositions.current.get(key);
      const offset = previousTop === undefined ? 0 : previousTop - top;
      if (previousTop === undefined) {
        item.animate(
          [
            { opacity: 0, transform: "translate3d(0, -12px, 0) scale(0.985)" },
            { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" },
          ],
          { duration: 420, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" },
        );
      } else if (Math.abs(offset) > 1) {
        item.animate(
          [
            { transform: `translate3d(0, ${offset}px, 0)` },
            { transform: "translate3d(0, 0, 0)" },
          ],
          { duration: 420, easing: "cubic-bezier(0.2, 0.75, 0.25, 1)" },
        );
      }
    }

    activityPositions.current = nextPositions;
  }, [activity]);

  const selectedUnit = MARKET_UNITS.find((item) => item.id === unit) ?? MARKET_UNITS[0];
  const displayedPrice = feed.price === null ? null : feed.price / selectedUnit.divisor;
  const displayedRange = range
    ? { high: range.high / selectedUnit.divisor, low: range.low / selectedUnit.divisor }
    : null;
  const chartSeries = useMemo(
    () => {
      const cutoff = Date.now() - (windowSize === "1m" ? 60_000 : 120_000);
      const visible = prices.filter((point) => point.t >= cutoff);
      const points = visible.length ? visible : prices.slice(-1);
      return points.map((point) => ({ ...point, p: point.p / selectedUnit.divisor }));
    },
    [prices, selectedUnit.divisor, windowSize],
  );
  const statusText = feed.status === "live"
    ? t("liveBadge")
    : feed.status === "failed"
      ? t("landingMarketReconnecting")
      : t("landingMarketConnecting");
  const trend = feed.price !== null && startPrice !== null ? feed.price - startPrice : 0;
  const trendPercent = startPrice ? (trend / startPrice) * 100 : null;
  const displayedTrend = trend / selectedUnit.divisor;

  return (
    <section aria-labelledby="market-title" className="landing-market-section reveal" id="market">
      <div
        className="landing-market-card"
        data-status={feed.status}
        data-trend={trend > 0 ? "up" : trend < 0 ? "down" : "flat"}
        ref={marketCardRef}
      >
        <div aria-hidden="true" className="landing-market-orb landing-market-orb-a" />
        <div aria-hidden="true" className="landing-market-orb landing-market-orb-b" />
        <div className="landing-market-hero">
          <div className="landing-market-price-panel">
            <div className="landing-market-brandline">
              <span className="landing-market-status"><i />{statusText}</span>
              <span className="landing-market-source"><Activity aria-hidden="true" size={15} />{t("landingMarketSource")}</span>
            </div>
            <div aria-live="polite" className="landing-market-price-row">
              {displayedPrice === null ? (
                <p className="landing-market-price-placeholder">{t("priceUnavailable")}</p>
              ) : (
                <AnimatedNumber
                  className="landing-market-price"
                  duration={450}
                  key={unit}
                  format={formatPrice}
                  value={displayedPrice}
                />
              )}
              {displayedPrice !== null && <span className="landing-market-unit">/ {t(selectedUnit.label)}</span>}
            </div>
            <div className="landing-market-change" data-trend={trend > 0 ? "up" : trend < 0 ? "down" : "flat"}>
              {trend > 0 ? <ArrowUpRight aria-hidden="true" size={20} /> : trend < 0 ? <ArrowDownRight aria-hidden="true" size={20} /> : <span className="landing-market-change-dash" />}
              <strong>
                {displayedPrice === null || startPrice === null
                  ? "—"
                  : `${trend > 0 ? "+" : trend < 0 ? "−" : ""}${formatUsd(String(Math.abs(displayedTrend)), locale)}`}
              </strong>
              <span>
                {trendPercent === null
                  ? "—"
                  : `${trendPercent > 0 ? "+" : trendPercent < 0 ? "−" : ""}${new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(Math.abs(trendPercent))}%`}
              </span>
            </div>
          </div>
          <div className="landing-market-brand">
            <div className="landing-market-brand-copy">
              <p className="landing-market-eyebrow">{t("landingMarketTitle")}</p>
              <p className="landing-market-description">{t("landingMarketDescription")}</p>
            </div>
            <div className="landing-market-art">
              <GoldBullionArt />
            </div>
          </div>
        </div>

        <div className="landing-market-dashboard">
          <div className="landing-market-chart-panel">
            <div className="landing-market-chart-toolbar">
              <div className="landing-market-chart-title">
                <p>{t("priceChart")}</p>
                <span data-status={feed.status}><i />{statusText}</span>
              </div>
              <div className="landing-market-chart-controls">
                <div aria-label={t("priceChart")} className="landing-market-window">
                  {(["1m", "2m"] as const).map((size) => (
                    <button
                      aria-pressed={windowSize === size}
                      key={size}
                      onClick={() => setWindowSize(size)}
                      type="button"
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <div aria-label={t("pricePerUnit", { unit: t(selectedUnit.label) })} className="landing-market-units">
                  {MARKET_UNITS.map((item) => (
                    <button
                      aria-pressed={unit === item.id}
                      key={item.id}
                      onClick={() => setUnit(item.id)}
                      type="button"
                    >
                      {t(item.label)}
                    </button>
                  ))}
                </div>
                <button
                  aria-label={isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
                  aria-pressed={isFullscreen}
                  className="landing-market-fullscreen"
                  onClick={() => void toggleFullscreen()}
                  title={isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
                  type="button"
                >
                  {isFullscreen ? <Minimize aria-hidden="true" size={15} /> : <Maximize aria-hidden="true" size={15} />}
                  <span>{isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}</span>
                </button>
                {fullscreenUnavailable && (
                  <span className="landing-market-fullscreen-error" role="status">{t("fullscreenUnavailable")}</span>
                )}
              </div>
            </div>
            {displayedPrice === null ? (
              <div className="landing-market-chart-wait">{statusText}</div>
            ) : (
              <div className="landing-market-chart-ticker">
                <LiveTicker
                  chartLabel={t("priceChart")}
                  formatPrice={formatPrice}
                  price={displayedPrice}
                  series={chartSeries}
                  showLastLabel
                  waitingText={statusText}
                >
                  <p className="live-mode-unit">/ {t(selectedUnit.label)}</p>
                </LiveTicker>
              </div>
            )}
          </div>

          <aside aria-label={t("landingMarketActivity")} className="landing-market-activity">
            <h3><Activity aria-hidden="true" size={17} />{t("landingMarketActivity")}</h3>
            {activity.length ? (
              <ol ref={activityListRef}>
                {[...activity].reverse().map((entry) => (
                  <li data-activity-key={`${entry.t}-${entry.p}`} key={`${entry.t}-${entry.p}`}>
                    <span aria-hidden="true" className="landing-market-activity-dot" />
                    <div>
                      <time dateTime={new Date(entry.t).toISOString()}>
                        {new Date(entry.t).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                      </time>
                      <strong>{formatUsd(String(entry.p / selectedUnit.divisor), locale)}</strong>
                      <small>{t("landingMarketSource")}</small>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="landing-market-activity-empty">{statusText}</p>
            )}
          </aside>
        </div>

        <div className="landing-market-stats">
          <div>
            <span className="landing-market-stat-icon"><Scale aria-hidden="true" size={23} /></span>
            <span className="landing-market-stat-label">{t("liveHigh")}</span>
            <strong>
              {displayedRange
                ? <AnimatedNumber duration={500} format={formatPrice} key={unit} value={displayedRange.high} />
                : "—"}
            </strong>
          </div>
          <div>
            <span className="landing-market-stat-icon"><GoldIcon aria-hidden="true" size={23} /></span>
            <span className="landing-market-stat-label">{t("liveLow")}</span>
            <strong>
              {displayedRange
                ? <AnimatedNumber duration={500} format={formatPrice} key={unit} value={displayedRange.low} />
                : "—"}
            </strong>
          </div>
          <div data-trend={trend > 0 ? "up" : trend < 0 ? "down" : "flat"}>
            <span className="landing-market-stat-icon"><Activity aria-hidden="true" size={23} /></span>
            <span className="landing-market-stat-label">{t("liveSinceOpened")}</span>
            <strong>
              {displayedPrice === null || startPrice === null
                ? "—"
                : (
                  <>
                    {trend > 0 ? <ArrowUpRight aria-hidden="true" size={15} /> : trend < 0 ? <ArrowDownRight aria-hidden="true" size={15} /> : null}
                    <AnimatedNumber
                      duration={500}
                      format={(value) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatUsd(String(Math.abs(value)), locale)}`}
                      value={displayedTrend}
                    />
                  </>
                )}
            </strong>
          </div>
        </div>
        {feed.updatedAt && (
          <p className="landing-market-updated">
            {t("updated", { date: new Date(feed.updatedAt).toLocaleTimeString(locale) })}
          </p>
        )}
      </div>
    </section>
  );
}

function FeatureCard({
  tone,
  icon,
  title,
  subtitle,
  bullets,
  children,
  delay,
}: {
  tone: "red" | "gold";
  icon: ReactNode;
  title: string;
  subtitle: string;
  bullets: string[];
  children?: ReactNode;
  delay: string;
}) {
  return (
    <article className="landing-feature glass reveal" data-tone={tone} style={{ "--d": delay } as React.CSSProperties}>
      <div className="landing-feature-head">
        <span aria-hidden="true" className="landing-feature-icon">{icon}</span>
        <div className="min-w-0">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <ul className="landing-checklist">
        {bullets.map((bullet, index) => (
          <li key={index}>
            <Check aria-hidden="true" size={15} strokeWidth={2.6} />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
      {children}
    </article>
  );
}

function Features() {
  const { t } = useLanguage();
  const youtube = (["youtubeFeature1", "youtubeFeature2", "youtubeFeature3", "youtubeFeature4"] as const).map((key) => t(key));
  const gold = (["goldFeature1", "goldFeature2", "goldFeature3", "goldFeature4", "goldFeature5"] as const).map((key) => t(key));
  return (
    <section aria-labelledby="features-title" className="landing-section" id="features">
      <SectionHeading eyebrow={t("navFeatures")} id="features-title" title={t("featuresTitle")} />
      <div className="landing-feature-grid">
        <FeatureCard
          bullets={youtube}
          delay="0ms"
          icon={<CirclePlay size={26} strokeWidth={1.9} />}
          subtitle={t("youtubeSubtitle")}
          title={t("youtubeTitle")}
          tone="red"
        >
          <div aria-hidden="true" className="landing-mini landing-mini-youtube">
            <span><CirclePlay size={14} />{t("shorts")}</span>
            <span>{t("favorites")}</span>
            <span>{t("recent")}</span>
          </div>
        </FeatureCard>
        <FeatureCard
          bullets={gold}
          delay="90ms"
          icon={<GoldIcon size={26} strokeWidth={1.9} />}
          subtitle={t("goldSubtitle")}
          title={t("goldTrading")}
          tone="gold"
        >
          <div aria-hidden="true" className="landing-mini landing-mini-gold">
            <span className="landing-live"><i />{t("liveBadge")}</span>
            <svg preserveAspectRatio="none" viewBox="0 0 120 36">
              <defs>
                <linearGradient id="landing-spark" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 28 L14 24 L26 27 L40 18 L54 21 L68 12 L82 15 L96 8 L120 4 L120 36 L0 36 Z" fill="url(#landing-spark)" />
              <path d="M0 28 L14 24 L26 27 L40 18 L54 21 L68 12 L82 15 L96 8 L120 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </FeatureCard>
      </div>
    </section>
  );
}

function Steps() {
  const { t } = useLanguage();
  const steps = [
    { icon: <Send aria-hidden="true" size={22} />, title: t("step1Title"), text: t("step1Text") },
    { icon: <LayoutGrid aria-hidden="true" size={22} />, title: t("step2Title"), text: t("step2Text") },
    { icon: <Smartphone aria-hidden="true" size={22} />, title: t("step3Title"), text: t("step3Text") },
  ];
  return (
    <section aria-labelledby="steps-title" className="landing-section" id="how-it-works">
      <SectionHeading eyebrow={t("navHowItWorks")} id="steps-title" title={t("stepsTitle")} />
      <ol className="landing-steps">
        {steps.map((step, index) => (
          <li className="landing-step glass reveal" key={index} style={{ "--d": `${index * 90}ms` } as React.CSSProperties}>
            <span aria-hidden="true" className="landing-step-number">{index + 1}</span>
            <span aria-hidden="true" className="landing-step-icon">{step.icon}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Showcase() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="demo-title" className="landing-section" id="demo">
      <SectionHeading eyebrow={t("showcaseEyebrow")} id="demo-title" title={t("showcaseTitle")} />
      <div className="reveal">
        <WelcomeBannerDemo />
      </div>
      <figure className="landing-banner reveal">
        <div className="relative aspect-[1.9/1] w-full">
          <Image alt="" className="object-cover" fill sizes="(max-width: 1024px) 100vw, 1024px" src="/banner.webp" />
          <div aria-hidden="true" className="welcome-banner-shade absolute inset-0 bg-gradient-to-t from-[#07142c]/40 via-transparent to-transparent" />
          <figcaption className="landing-banner-caption">
            <Sparkles aria-hidden="true" size={13} />
            {t("welcomeEyebrow")}
          </figcaption>
        </div>
      </figure>
    </section>
  );
}

function Faq() {
  const { t } = useLanguage();
  const items = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
  ];
  return (
    <section aria-labelledby="faq-title" className="landing-section landing-faq" id="faq">
      <SectionHeading eyebrow={t("navFaq")} id="faq-title" title={t("faqTitle")} />
      <div className="landing-faq-list reveal">
        {items.map((item, index) => (
          <details className="landing-faq-item glass" key={index} name="landing-faq">
            <summary>
              <span>{item.q}</span>
              <ChevronDown aria-hidden="true" className="landing-faq-chevron" size={18} />
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="final-title" className="landing-final reveal">
      <div aria-hidden="true" className="landing-final-glow" />
      <h2 id="final-title">{t("finalCtaTitle")}</h2>
      <p>{t("finalCtaText")}</p>
      <TelegramCta className="mx-auto max-w-sm" hint id="landing-final-cta" />
      <p className="landing-telegram-only">{t("telegramOnly")}</p>
    </section>
  );
}

function LandingFooter() {
  const { t } = useLanguage();
  return (
    <footer className="welcome-footer mx-auto mt-10 w-full max-w-3xl sm:mt-14">
      <div className="welcome-footer-card">
        <div className="welcome-footer-copyright">
          <span className="welcome-footer-mark" aria-hidden="true">H</span>
          <div>
            <p className="text-sm font-bold tracking-tight">Helper</p>
            <p className="mt-1 text-xs text-muted">{t("copyrightNotice", { year: new Date().getFullYear() })}</p>
          </div>
        </div>
        <div className="welcome-footer-owner">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{t("ownerLabel")}</span>
          <span className="text-sm font-semibold">Sambath Reasmey</span>
        </div>
        <a
          aria-label={t("contactOwner")}
          className="welcome-footer-contact"
          href="https://t.me/sambathreasmey"
          rel="noreferrer"
          target="_blank"
        >
          <Send aria-hidden="true" size={15} />
          <span>@sambathreasmey</span>
          <ArrowRight aria-hidden="true" className="welcome-footer-arrow" size={14} />
        </a>
      </div>
    </footer>
  );
}

/** Shown to anyone who opens the site outside Telegram. Also the server-rendered HTML that search engines read. */
export function LandingPage() {
  const rootRef = useRef<HTMLElement>(null);
  useReveal(rootRef);

  return (
    <main className="landing" data-landing id="top" ref={rootRef}>
      <LandingHeader />
      <div className="landing-body">
        <Hero />
        <LandingMarket />
        <Features />
        <Steps />
        <Showcase />
        <Faq />
        <FinalCta />
        <LandingFooter />
      </div>
      {BOT_LINK && <StickyTelegramCta watchIds={STICKY_WATCH} />}
    </main>
  );
}
