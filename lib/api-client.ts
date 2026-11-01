import { API_BASE_URL } from "@/lib/api-config";

const TOKEN_KEY = "admin.access_token";
const REFRESH_KEY = "admin.refresh_token";

export type StoredTokens = {
  access: string | null;
  refresh: string | null;
};

export type ApiResult<T> =
  | { ok: true; status: number; data: T | null; message: string }
  | { ok: false; status: number; data: null; message: string };

export type ApiRequestOptions<TBody = unknown> = {
  method?: string;
  body?: TBody;
  query?: Record<string, string | number | boolean | null | undefined>;
  retry?: boolean;
};

type TokenResponse = {
  access_token?: unknown;
};

type ApiErrorPayload = {
  message?: unknown;
  msg?: unknown;
};

export function getStoredTokens(): StoredTokens {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: window.localStorage.getItem(TOKEN_KEY),
    refresh: window.localStorage.getItem(REFRESH_KEY),
  };
}

export function storeTokens({ access, refresh }: Partial<StoredTokens>): void {
  if (typeof window === "undefined") return;
  if (access) window.localStorage.setItem(TOKEN_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getStoredTokens();
  if (!refresh) return null;

  const response = await fetch(`${API_BASE_URL}/api/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refresh}` },
  });
  if (!response.ok) return null;

  const result: unknown = await response.json().catch(() => null);
  if (!result || typeof result !== "object") return null;
  const accessToken = (result as TokenResponse).access_token;
  if (typeof accessToken !== "string" || !accessToken) return null;

  storeTokens({ access: accessToken });
  return accessToken;
}

/**
 * Call the backend with the admin JWT. Retries once after a token refresh on 401.
 * Returns { ok, status, data, message }. Never throws on HTTP errors.
 */
export async function apiRequest<T = unknown, TBody = unknown>(
  path: string,
  { method = "GET", body, query, retry = true }: ApiRequestOptions<TBody> = {},
): Promise<ApiResult<T>> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const { access } = getStoredTokens();
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, status: 0, data: null, message: "Network error" };
  }

  if (response.status === 401 && retry) {
    let fresh: string | null;
    try {
      fresh = await refreshAccessToken();
    } catch {
      return {
        ok: false,
        status: 0,
        data: null,
        message: "Network error while refreshing session",
      };
    }
    if (fresh) return apiRequest<T, TBody>(path, { method, body, query, retry: false });
    clearTokens();
    return {
      ok: false,
      status: 401,
      data: null,
      message: "Session expired. Please sign in again.",
    };
  }

  const json: unknown = await response.json().catch(() => null);
  const payload =
    json && typeof json === "object" && "data" in json ? json.data : json;
  const errorPayload =
    json && typeof json === "object" ? (json as ApiErrorPayload) : null;
  const message = errorPayload?.message ?? errorPayload?.msg;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: null,
      message:
        typeof message === "string"
          ? message
          : `Request failed (${response.status})`,
    };
  }

  return {
    ok: true,
    status: response.status,
    data: (payload ?? null) as T | null,
    message: typeof message === "string" ? message : "",
  };
}
