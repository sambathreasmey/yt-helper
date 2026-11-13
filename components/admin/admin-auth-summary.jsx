"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Crown,
  Clock3,
  Radio,
  Smartphone,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminLogin, getSummary } from "@/services/dashboard-api";
import { storeTokens, getStoredTokens, clearTokens } from "@/lib/api-client";
import { formatUtcTimestamp } from "@/lib/date-format";

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

function formatDuration(value) {
  const seconds = Math.max(Number(value) || 0, 0);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function formatSessionUser(session) {
  return [session.first_name, session.last_name].filter(Boolean).join(" ") ||
    (session.username ? `@${session.username}` : String(session.chat_id));
}

/** All the key numbers in one compact grid, so the dashboard needs no scrolling to read them. */
export function SummaryTiles({ summary, onOpenActivity }) {
  const users = summary?.users || {};
  const sessions = summary?.sessions || {};
  const items = [
    ["Total", users.total_users, Users, "blue"],
    ["Active", users.active_users, UserCheck, "green"],
    ["Blocked", users.blocked_users, UserX, "rose"],
    ["Premium", users.premium_users, Crown, "gold"],
    ["New", users.new_today, UserPlus, "violet"],
    ["24h", users.active_last_24h, Activity, "cyan"],
    ["Sessions", sessions.total_sessions, Radio, "indigo"],
  ];
  return (
    <section aria-label="Admin overview" className="admin-stats">
      {items.map(([label, value, Icon, tone]) => (
        <div className="admin-stat" data-tone={tone} key={label} title={{ New: "New today", "24h": "Active in the last 24 hours" }[label] || label}>
          <Icon aria-hidden="true" size={15} strokeWidth={2.3} />
          <b className="tabular-nums">{summary ? Number(value) || 0 : "–"}</b>
          <small>{label}</small>
        </div>
      ))}
      <button className="admin-stat admin-stat-action" onClick={onOpenActivity} type="button">
        <Clock3 aria-hidden="true" size={15} strokeWidth={2.3} />
        <b>More</b>
        <small>Activity</small>
      </button>
    </section>
  );
}

/** User-activity bars and the latest sessions, shown in a sheet instead of two long cards. */
export function ActivitySheet({ open, onClose, summary }) {
  const users = summary?.users || {};
  const totalUsers = Math.max(Number(users.total_users) || 0, 0);
  const chartItems = [
    ["Active users", users.active_users, "green"],
    ["Premium users", users.premium_users, "gold"],
    ["Blocked users", users.blocked_users, "rose"],
    ["Active in 24h", users.active_last_24h, "blue"],
  ];
  const recentSessions = summary?.recent_sessions || [];

  return (
    <BottomSheet
      description="Current user counts and the most recent Mini App activity."
      icon={<Activity size={17} />}
      onClose={onClose}
      open={open}
      title="User activity"
    >
      <div className="space-y-4">
        <div className="space-y-3" role="img" aria-label="Horizontal bar chart of active, premium, blocked, and recently active users">
          <p className="admin-chart-total">{totalUsers} total users</p>
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

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.09em] text-muted">Latest {recentSessions.length || 5} sessions</p>
          {recentSessions.length > 0 ? (
            <ol className="admin-recent-session-list">
              {recentSessions.map((session) => (
                <li className="admin-recent-session-row" key={session.id}>
                  <span className="admin-session-platform-icon" aria-hidden="true"><Smartphone size={17} /></span>
                  <span className="admin-session-user">
                    <strong>{formatSessionUser(session)}</strong>
                    <small>
                      {session.platform || "Platform not reported"}
                      {session.username ? ` · @${session.username}` : ""}
                    </small>
                  </span>
                  <span className="admin-session-time">
                    <time dateTime={session.session_start || undefined}>
                      {session.session_start ? formatUtcTimestamp(session.session_start) : "Time unavailable"}
                    </time>
                    <small>{session.session_end ? formatDuration(session.duration_seconds) : "In progress"}</small>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="admin-recent-sessions-empty">No user sessions have been recorded yet.</p>
          )}
        </div>
      </div>
    </BottomSheet>
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
