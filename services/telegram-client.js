export function isInsideTelegram() {
  if (typeof window === "undefined") return false;
  const initData = window.Telegram?.WebApp?.initData;
  return typeof initData === "string" && initData.length > 0;
}

export function getTelegramClient() {
  if (typeof window === "undefined") return null;

  return window.Telegram?.WebApp || null;
}

export function getTelegramProfile(telegram) {
  const user = telegram?.initDataUnsafe?.user;
  if (!user) return null;

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "";
  return {
    name,
    handle: user.username ? `@${user.username}` : "Connected with Telegram",
    photoUrl: user.photo_url || null,
  };
}

export function impactTelegram(telegram, style = "light") {
  try {
    telegram?.HapticFeedback?.impactOccurred(style);
  } catch {
    // Haptic feedback is unavailable in some clients.
  }
}

export function openTelegramLink(telegram, url, { browser = false } = {}) {
  if (browser && telegram?.openLink) {
    telegram.openLink(url, { try_instant_view: false });
    return;
  }

  try {
    telegram?.exitFullscreen?.();
  } catch {
    // Older Telegram clients may not implement fullscreen controls.
  }

  window.setTimeout(() => window.location.replace(url), 250);
}
