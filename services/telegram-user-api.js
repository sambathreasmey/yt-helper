const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://sambathreasmey1app.pythonanywhere.com";

export async function registerTelegramUser(profile) {
  if (!profile?.chatId) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/telegram-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: profile.chatId,
        first_name: profile.firstName || null,
        last_name: profile.lastName || null,
        username: profile.username || null,
        language_code: profile.languageCode || null,
        is_premium: Boolean(profile.isPremium),
        photo_url: profile.photoUrl || null,
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
