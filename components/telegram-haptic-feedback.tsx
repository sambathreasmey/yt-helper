"use client";

import { useEffect } from "react";
import { getTelegramClient, impactTelegram } from "@/services/telegram-client";

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  "input[type='checkbox']",
  "input[type='radio']",
  "select",
  "summary",
  "[role='button']",
  "[role='switch']",
  "[role='checkbox']",
  "[role='radio']",
  "[data-haptic]",
].join(",");

export function TelegramHapticFeedback() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (document.documentElement.dataset.haptics === "off") return;
      const target = event.target.closest(INTERACTIVE_SELECTOR);
      if (!target || target.closest("[data-haptic='off']")) return;
      if (target.matches(":disabled, [aria-disabled='true']")) return;
      impactTelegram(getTelegramClient(), "light");
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
