"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminLogin, getSummary } from "@/services/dashboard-api";
import { storeTokens, getStoredTokens, clearTokens } from "@/lib/api-client";

export function AdminLogin({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await adminLogin(username, password);
    setBusy(false);
    if (!response.ok || !response.data) {
      setError(response.message || "Login failed");
      return;
    }
    storeTokens({ access: response.data.access_token, refresh: response.data.refresh_token });
    onLoggedIn();
  }

  return (
    <Card className="mx-auto mt-16 max-w-sm p-6">
      <CardHeader className="p-0">
        <CardTitle>Admin sign in</CardTitle>
        <CardDescription>Dashboard access for Telegram user management.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-0 pt-4">
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy || !username || !password}>
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ summary }) {
  if (!summary) return null;
  const users = summary.users || {};
  const sessions = summary.sessions || {};
  const items = [
    ["Total users", users.total_users],
    ["Active", users.active_users],
    ["Blocked", users.blocked_users],
    ["Premium", users.premium_users],
    ["New today", users.new_today],
    ["Active 24h", users.active_last_24h],
    ["Sessions", sessions.total_sessions],
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(([label, value]) => (
        <Card key={label} className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">{label}</p>
          <p className="mt-1 text-lg font-semibold">{value ?? 0}</p>
        </Card>
      ))}
    </div>
  );
}

export function useAdminSummary() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const response = await getSummary();
    if (response.ok) {
      setSummary(response.data);
      setError("");
    } else {
      setError(response.message);
    }
  }

  return { summary, error, load };
}

export function isLoggedIn() {
  return Boolean(getStoredTokens().access);
}

export function logout() {
  clearTokens();
}
