import Script from "next/script";
import { ThemeProvider } from "@/providers/theme-provider";
import { themeBootScript } from "@/providers/theme-boot";
import { LanguageProvider } from "@/providers/language-provider";
import { QueryProvider } from "@/providers/query-provider";
import { TelegramHapticFeedback } from "@/components/telegram-haptic-feedback";
import "./globals.css";
import type { Metadata, Viewport } from "next";

const siteUrl = "https://sambathreasmey.online";
const siteTitle = "Helper Mini App";
const siteDescription = "YouTube tools and gold trading management for Telegram.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  applicationName: siteTitle,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
    images: [{ url: "/banner.png", width: 1200, height: 630, alt: siteTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/banner.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="km" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Khmer:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <QueryProvider>
          <TelegramHapticFeedback />
          <LanguageProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
