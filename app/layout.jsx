import Script from "next/script";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

export const metadata = {
  title: "YouTube Helper",
  description: "A lightweight YouTube helper for Telegram.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
