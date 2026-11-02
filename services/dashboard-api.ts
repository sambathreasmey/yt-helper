import { apiRequest, type ApiResult } from "@/lib/api-client";

const BASE = "/api/telegram/dashboard";

export type AdminLoginResponse = {
  access_token: string;
  refresh_token: string;
};

export type DashboardSummary = {
  users?: Record<string, number>;
  sessions?: Record<string, number>;
  recent_sessions?: RecentDashboardSession[];
};

export type RecentDashboardSession = {
  id: string | number;
  chat_id: string | number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  platform?: string | null;
  session_start?: string | null;
  session_end?: string | null;
  duration_seconds: number;
};

export type DashboardUser = {
  id: string | number;
  chat_id: string | number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  plan_type?: string | null;
  status: string;
  total_sessions: number;
  is_premium?: boolean;
  language_code?: string | null;
  created_on?: string | null;
  last_active_on?: string | null;
};

export type UserListParams = {
  search?: string;
  status?: string;
  is_premium?: string;
  page?: number;
  page_size?: number;
};

export type UserListResponse = {
  items: DashboardUser[];
  total: number;
};

export type UserDetail = {
  user: DashboardUser;
  subscription?: {
    plan_type?: string | null;
    status?: string | null;
    subscription_ends_on?: string | null;
    trial_ends_on?: string | null;
  } | null;
  session_stats?: {
    total_sessions?: number;
    total_duration_seconds?: number;
    last_session?: string | null;
  };
  referrals?: {
    total?: number;
    completed?: number;
  };
  settings: Array<{
    setting_key: string;
    setting_value: unknown;
  }>;
};

export type UserEvent = {
  id: string | number;
  event_name?: string | null;
  event_type?: string | null;
  created_on?: string | null;
};

export type SettingInput = {
  value: unknown;
  type: string;
  description?: string;
};

export type AdminGoldPrice = {
  price_per_damlung: string;
  source: string;
  updated_on: string;
};

export type GoldPriceUpdateResult = {
  price: AdminGoldPrice;
  triggered_alerts: number;
  notification_failures: number;
};

export type AutoRedirectSetting = {
  seconds: number;
};

export type AdvertisementSetting = {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string;
  link_url: string;
};

export type AppDefaultLanguage = "KH" | "EN" | "CN";

export type GlobalAppSettings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  announcement_enabled: boolean;
  announcement_title: string;
  announcement_message: string;
  announcement_link_url: string;
  youtube_enabled: boolean;
  gold_trade_enabled: boolean;
  support_url: string;
  default_language: AppDefaultLanguage;
  github_gold_price_updates_enabled: boolean;
};

export type TelegramBroadcastKind = "maintenance" | "announcement";

export type TelegramBroadcastResult = {
  total: number;
  sent: number;
  failed: number;
};

export const GLOBAL_APP_SETTINGS_QUERY_KEY = ["app-settings", "global"] as const;
export const DEFAULT_GLOBAL_APP_SETTINGS: GlobalAppSettings = {
  maintenance_mode: false,
  maintenance_message: "We are performing maintenance. Please check back soon.",
  announcement_enabled: false,
  announcement_title: "",
  announcement_message: "",
  announcement_link_url: "",
  youtube_enabled: true,
  gold_trade_enabled: true,
  support_url: "",
  default_language: "KH",
  github_gold_price_updates_enabled: false,
};

export const getAutoRedirectSetting = (): Promise<ApiResult<AutoRedirectSetting>> =>
  apiRequest(`${BASE}/auto-redirect`, { useAuth: false });

export const updateAutoRedirectSetting = (
  seconds: number,
): Promise<ApiResult<AutoRedirectSetting>> =>
  apiRequest(`${BASE}/auto-redirect`, {
    method: "PUT",
    body: { seconds },
  });

export const getAdvertisementSetting = (): Promise<ApiResult<AdvertisementSetting>> =>
  apiRequest(`${BASE}/advertisement`, { useAuth: false });

export const updateAdvertisementSetting = (
  setting: AdvertisementSetting,
): Promise<ApiResult<AdvertisementSetting>> =>
  apiRequest(`${BASE}/advertisement`, {
    method: "PUT",
    body: setting,
  });

export const getGlobalAppSettings = (): Promise<ApiResult<GlobalAppSettings>> =>
  apiRequest(`${BASE}/global-settings`, { useAuth: false });

export const updateGlobalAppSettings = (
  settings: GlobalAppSettings,
): Promise<ApiResult<GlobalAppSettings>> =>
  apiRequest(`${BASE}/global-settings`, {
    method: "PUT",
    body: settings,
  });

export const sendGlobalTelegramNotification = (
  kind: TelegramBroadcastKind,
): Promise<ApiResult<TelegramBroadcastResult>> =>
  apiRequest(`${BASE}/notifications/broadcast`, {
    method: "POST",
    body: { kind },
  });

export const sendUserTelegramNotification = (
  chatId: string | number,
  message: string,
): Promise<ApiResult<{ sent: boolean }>> =>
  apiRequest(`${BASE}/notifications/user`, {
    method: "POST",
    body: { chat_id: chatId, message },
  });

export const adminLogin = (
  username: string,
  password: string,
): Promise<ApiResult<AdminLoginResponse>> =>
  apiRequest("/api/login", {
    method: "POST",
    body: { username, password },
    retry: false,
  });

export const getAdminGoldPrice = (): Promise<ApiResult<AdminGoldPrice>> =>
  apiRequest("/api/gold/price/admin");

export const updateAdminGoldPrice = (
  pricePerDamlung: string,
): Promise<ApiResult<GoldPriceUpdateResult>> =>
  apiRequest("/api/gold/price", {
    method: "POST",
    body: { price_per_damlung: pricePerDamlung, source: "manual" },
  });

export const getSummary = (): Promise<ApiResult<DashboardSummary>> =>
  apiRequest(`${BASE}/summary`);

export const listUsers = (
  params?: UserListParams,
): Promise<ApiResult<UserListResponse>> =>
  apiRequest(`${BASE}/users`, { query: params });

export const getUserDetail = (
  chatId: string | number,
): Promise<ApiResult<UserDetail>> =>
  apiRequest(`${BASE}/users/${encodeURIComponent(String(chatId))}`);

export const getUserEvents = (
  chatId: string | number,
  params?: { limit?: number },
): Promise<ApiResult<UserEvent[]>> =>
  apiRequest(
    `${BASE}/users/${encodeURIComponent(String(chatId))}/events`,
    { query: params },
  );

export const setUserStatus = (
  chatId: string | number,
  status: string,
): Promise<ApiResult<unknown>> =>
  apiRequest(`${BASE}/users/${encodeURIComponent(String(chatId))}/status`, {
    method: "POST",
    body: { status },
  });

export const grantPremium = (
  chatId: string | number,
  body: { plan_type: string; duration_days: number; payment_provider: string },
): Promise<ApiResult<unknown>> =>
  apiRequest(`${BASE}/users/${encodeURIComponent(String(chatId))}/premium`, {
    method: "POST",
    body,
  });

export const cancelPremium = (
  chatId: string | number,
  reason: string,
): Promise<ApiResult<unknown>> =>
  apiRequest(
    `${BASE}/users/${encodeURIComponent(String(chatId))}/premium/cancel`,
    { method: "POST", body: { reason } },
  );

export const startTrial = (
  chatId: string | number,
  trialDays: number,
): Promise<ApiResult<unknown>> =>
  apiRequest(`${BASE}/users/${encodeURIComponent(String(chatId))}/trial`, {
    method: "POST",
    body: { trial_days: trialDays },
  });

export const saveSetting = (
  chatId: string | number,
  key: string,
  { value, type, description }: SettingInput,
): Promise<ApiResult<unknown>> =>
  apiRequest(
    `${BASE}/users/${encodeURIComponent(String(chatId))}/settings/${encodeURIComponent(key)}`,
    {
      method: "PUT",
      body: { value, type, description },
    },
  );

export const deleteSetting = (
  chatId: string | number,
  key: string,
): Promise<ApiResult<unknown>> =>
  apiRequest(
    `${BASE}/users/${encodeURIComponent(String(chatId))}/settings/${encodeURIComponent(key)}`,
    { method: "DELETE" },
  );
