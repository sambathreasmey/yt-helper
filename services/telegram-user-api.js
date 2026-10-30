import { API_BASE_URL } from "@/lib/api-config";

export async function registerTelegramUser(initData, profile = {}) {
  if (!initData) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/telegram-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": initData,
      },
      body: JSON.stringify({
        platform: profile.platform || null,
        app_version: profile.appVersion || null,
      }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result?.data ?? null;
  } catch {
    return null;
  }
}
