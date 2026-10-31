import { API_BASE_URL } from "@/lib/api-config";

export class BlockedUserError extends Error {
  constructor(message = "User is blocked") {
    super(message);
    this.name = "BlockedUserError";
  }
}

export interface TelegramUserProfileInput {
  platform?: string;
  appVersion?: string;
}

export interface TelegramUserRecord {
  id: number;
  chat_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  full_name: string | null;
  language_code: string | null;
  is_premium: boolean | null;
  photo_url: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED" | string;
  last_active_on: string | null;
  created_on: string | null;
}

export interface TelegramUserData {
  user: TelegramUserRecord;
  subscription: unknown;
  session_id: unknown;
  is_new_user: boolean;
}

/**
 * Registers the Telegram user with the backend.
 * Throws BlockedUserError when the backend answers 403 (user is blocked).
 * Returns null for any other failure so the app keeps working offline.
 */
export async function registerTelegramUser(
  initData: string,
  profile: TelegramUserProfileInput = {},
): Promise<TelegramUserData | null> {
  if (!initData) return null;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/telegram-user`, {
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
  } catch {
    return null;
  }

  if (response.status === 403) throw new BlockedUserError();
  if (!response.ok) return null;

  try {
    const result = (await response.json()) as { data?: TelegramUserData };
    return result?.data ?? null;
  } catch {
    return null;
  }
}
