"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Crown,
  Radio,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
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
    <Card className="admin-login-card mx-auto mt-16 max-w-sm p-6 sm:p-7">
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
    ["Total users", users.total_users, Users, "blue"],
    ["Active", users.active_users, UserCheck, "green"],
    ["Blocked", users.blocked_users, UserX, "rose"],
    ["Premium", users.premium_users, Crown, "gold"],
    ["New today", users.new_today, UserPlus, "violet"],
    ["Active 24h", users.active_last_24h, Activity, "cyan"],
    ["Sessions", sessions.total_sessions, Radio, "indigo"],
  ];
  const totalUsers = Math.max(Number(users.total_users) || 0, 0);
  const chartItems = [
    ["Active users", users.active_users, "green"],
    ["Premium users", users.premium_users, "gold"],
    ["Blocked users", users.blocked_users, "rose"],
    ["Active in 24h", users.active_last_24h, "blue"],
  ];

  return (
    <section className="admin-overview space-y-3" aria-label="Admin overview">
      <div className="admin-summary-grid grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map(([label, value, Icon, tone]) => (
          <Card key={label} className="admin-metric-card rounded-3xl p-3.5 sm:p-4" data-tone={tone}>
            <span className="admin-metric-icon" aria-hidden="true"><Icon size={19} strokeWidth={2.2} /></span>
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">{label}</span>
              <span className="mt-1 block text-xl font-bold tabular-nums">{Number(value) || 0}</span>
            </span>
          </Card>
        ))}
      </div>
      <Card className="admin-chart-card p-4 sm:p-5">
        <div className="admin-section-heading mb-4">
          <span className="admin-heading-icon" aria-hidden="true"><Activity size={18} /></span>
          <div>
            <h2 className="text-sm font-bold">User activity</h2>
            <p className="mt-0.5 text-xs text-muted">Current user counts by status and activity</p>
          </div>
          <span className="admin-chart-total ml-auto">{totalUsers} total</span>
        </div>
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2" role="img" aria-label="Horizontal bar chart of active, premium, blocked, and recently active users">
          {chartItems.map(([label, value, tone]) => {
            const count = Math.max(Number(value) || 0, 0);
            const width = totalUsers > 0 ? Math.min((count / totalUsers) * 100, 100) : 0;
            return (
              <div className="admin-chart-row" key={label}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <span>{label}</span>
                  <span className="font-bold tabular-nums">{count}</span>
                </div>
                <div className="admin-chart-track" aria-hidden="true">
                  <span className="admin-chart-bar" data-tone={tone} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

export function useAdminSummary(enabled) {
  const query = useQuery({
    queryKey: ["admin", "summary"],
    queryFn: async () => {
      const response = await getSummary();
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to load dashboard summary");
      }
      return response.data;
    },
    enabled,
  });

  return {
    summary: query.data || null,
    error: query.error?.message || "",
  };
}

export function isLoggedIn() {
  return Boolean(getStoredTokens().access);
}

export function logout() {
  clearTokens();
}
