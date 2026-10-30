import { apiRequest } from "@/lib/api-client";

const BASE = "/api/telegram/dashboard";

export const adminLogin = (username, password) =>
  apiRequest("/api/login", { method: "POST", body: { username, password }, retry: false });

export const getSummary = () => apiRequest(`${BASE}/summary`);

export const listUsers = (params) => apiRequest(`${BASE}/users`, { query: params });

export const getUserDetail = (chatId) => apiRequest(`${BASE}/users/${chatId}`);

export const getUserEvents = (chatId, params) => apiRequest(`${BASE}/users/${chatId}/events`, { query: params });

export const setUserStatus = (chatId, status) =>
  apiRequest(`${BASE}/users/${chatId}/status`, { method: "POST", body: { status } });

export const grantPremium = (chatId, body) =>
  apiRequest(`${BASE}/users/${chatId}/premium`, { method: "POST", body });

export const cancelPremium = (chatId, reason) =>
  apiRequest(`${BASE}/users/${chatId}/premium/cancel`, { method: "POST", body: { reason } });

export const startTrial = (chatId, trialDays) =>
  apiRequest(`${BASE}/users/${chatId}/trial`, { method: "POST", body: { trial_days: trialDays } });

export const saveSetting = (chatId, key, { value, type, description }) =>
  apiRequest(`${BASE}/users/${chatId}/settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: { value, type, description },
  });

export const deleteSetting = (chatId, key) =>
  apiRequest(`${BASE}/users/${chatId}/settings/${encodeURIComponent(key)}`, { method: "DELETE" });
