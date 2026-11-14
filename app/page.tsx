import { TelegramOnlyGate } from "@/components/telegram-only-gate";
import { AppFeatureShell } from "@/components/app-feature-shell";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Helper Mini App",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Telegram",
  url: "https://sambathreasmey.online",
  description:
    "A Telegram Mini App for YouTube and gold trading: open YouTube in one tap, track live gold prices, record purchases and sales, and get price alerts.",
  inLanguage: ["km", "en", "zh"],
};

export default function Page() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />
      <TelegramOnlyGate>
        <AppFeatureShell />
      </TelegramOnlyGate>
    </>
  );
}
