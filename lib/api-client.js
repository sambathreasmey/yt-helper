const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://sambathreasmey1app.pythonanywhere.com";
const TOKEN_KEY = "admin.access_token";
const REFRESH_KEY = "admin.refresh_token";

export function getStoredTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null };
  return {
    access: window.localStorage.getItem(TOKEN_KEY),
    refresh: window.localStorage.getItem(REFRESH_KEY),
  };
}

export function storeTokens({ access, refresh }) {
  if (access) window.localStorage.setItem(TOKEN_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken() {
  const { refresh } = getStoredTokens();
  if (!refresh) return null;
  const response = await fetch(`${API_BASE_URL}/api/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refresh}` },
  });
  if (!response.ok) return null;
  const result = await response.json();
  if (!result.access_token) return null;
  storeTokens({ access: result.access_token });
  return result.access_token;
}

/**
 * Call the backend with the admin JWT. Retries once after a token refresh on 401.
 * Returns { ok, status, data, message }. Never throws on HTTP errors.
 */
export async function apiRequest(path, { method = "GET", body, query, retry = true } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
  }

  const { access } = getStoredTokens();
  let response;
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
    const fresh = await refreshAccessToken();
    if (fresh) return apiRequest(path, { method, body, query, retry: false });
    clearTokens();
    return { ok: false, status: 401, data: null, message: "Session expired. Please sign in again." };
  }

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, status: response.status, data: null, message: json?.message || json?.msg || `Request failed (${response.status})` };
  }
  return { ok: true, status: response.status, data: json?.data ?? json, message: json?.message || "" };
}
