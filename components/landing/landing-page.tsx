"use client";

import Image from "next/image";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import {
  ArrowRight,
  BellRing,
  Check,
  ChevronDown,
  CirclePlay,
  Coins,
  LayoutGrid,
  Play,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { WelcomeBannerDemo } from "@/components/welcome-banner-demo";
import { BOT_LINK, StickyTelegramCta, TelegramCta } from "@/components/landing/telegram-cta";
import { useReveal } from "@/components/landing/use-reveal";
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
  return (
    <div aria-hidden={false} className="landing-visual">
      <div aria-hidden="true" className="landing-glow" />
      <div className="landing-phone">
        <span aria-hidden="true" className="landing-phone-notch" />
        <Image
          alt={t("landingPhoneAlt")}
          className="landing-phone-img"
          height={1280}
          priority
          sizes="(max-width: 768px) 62vw, 320px"
          src="/demo/helper-home-screen-mobile.jpg"
          width={720}
        />
      </div>
      <div aria-hidden="true" className="landing-chip landing-chip-a">
        <Coins size={15} />
        <span>{t("goldTrading")}</span>
        <span className="landing-live"><i />{t("liveBadge")}</span>
      </div>
      <div aria-hidden="true" className="landing-chip landing-chip-b">
        <CirclePlay size={15} />
        <span>{t("youtubeTitle")}</span>
      </div>
      <div aria-hidden="true" className="landing-chip landing-chip-c">
        <BellRing size={15} />
        <span>{t("priceAlerts")}</span>
      </div>
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
  const gold = (["goldFeature1", "goldFeature2", "goldFeature3", "goldFeature4"] as const).map((key) => t(key));
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
          icon={<Coins size={26} strokeWidth={1.9} />}
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
