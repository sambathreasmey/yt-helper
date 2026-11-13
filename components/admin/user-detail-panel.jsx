"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { SheetTabs } from "@/components/sheet-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cancelPremium, deleteSetting, getUserDetail, getUserEvents,
  grantPremium, saveSetting, setUserStatus, startTrial,
} from "@/services/dashboard-api";
import { useAdminAction } from "@/hooks/use-admin-action";
import { Field, formatUserName, selectClass } from "@/components/admin/ui";

const PLANS = ["PREMIUM_MONTHLY", "PREMIUM_YEARLY", "PREMIUM_LIFETIME"];
const STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"];
const TABS = [
  { id: "profile", label: "Profile" },
  { id: "plan", label: "Plan" },
  { id: "activity", label: "Activity" },
];

function UserDetailBody({ chatId }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("profile");
  const [plan, setPlan] = useState(PLANS[0]);
  const [days, setDays] = useState("30");
  const [trialDays, setTrialDays] = useState("7");
  const [settingKey, setSettingKey] = useState("");
  const [settingValue, setSettingValue] = useState("");

  const detailQuery = useQuery({
    queryKey: ["admin", "user", chatId],
    queryFn: async () => {
      const response = await getUserDetail(chatId);
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to load user");
      }
      return response.data;
    },
    enabled: Boolean(chatId),
  });
  const eventsQuery = useQuery({
    queryKey: ["admin", "user-events", chatId, 20],
    queryFn: async () => {
      const response = await getUserEvents(chatId, { limit: 20 });
      if (!response.ok) {
        throw new Error(response.message || "Unable to load recent activity");
      }
      return response.data || [];
    },
    enabled: Boolean(chatId),
  });
  const detail = detailQuery.data;
  const events = eventsQuery.data || [];
  const loadError = detailQuery.error?.message || eventsQuery.error?.message || "";

  const { busy, message, run } = useAdminAction(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "user", chatId] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "user-events", chatId] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "summary"] }),
    ]);
  });

  if (!detail) {
    return (
      <p className={loadError ? "status-error rounded-xl px-3 py-2 text-sm" : "py-6 text-center text-sm text-muted"}>
        {loadError || "Loading..."}
      </p>
    );
  }

  const { user: u, subscription, session_stats: stats = {}, referrals = {} } = detail;
  const sub = subscription || {};
  const settings = detail.settings || [];

  return (
    <div className="space-y-3">
      <div className="admin-user-hero">
        <span aria-hidden="true" className="gold-row-badge">{formatUserName(u).replace(/^@/, "").slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{formatUserName(u)}</p>
          <p className="truncate text-xs text-muted">{u.username ? `@${u.username}` : "No username"} · chat {u.chat_id}</p>
        </div>
        <span className="admin-user-status" data-status={String(u.status).toLowerCase()}>{u.status}</span>
      </div>

      <SheetTabs onChange={setTab} tabs={TABS} value={tab} />

      {tab === "profile" && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.09em] text-muted">Account status</p>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={u.status === s ? "primary" : "secondary"}
                  disabled={busy || u.status === s}
                  onClick={() => run(() => setUserStatus(chatId, s), `Status set to ${s}`)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            <Field label="Premium flag" value={u.is_premium ? "Yes" : "No"} />
            <Field label="Language" value={u.language_code} />
            <Field label="Plan" value={sub.plan_type} />
            <Field label="Plan status" value={sub.status} />
            <Field label="Plan ends" value={sub.subscription_ends_on} />
            <Field label="Trial ends" value={sub.trial_ends_on} />
            <Field label="Sessions" value={stats.total_sessions} />
            <Field label="Total time (s)" value={stats.total_duration_seconds} />
            <Field label="Last session" value={stats.last_session} />
            <Field label="Referrals" value={`${referrals.total ?? 0} (${referrals.completed ?? 0} completed)`} />
            <Field label="Last active" value={u.last_active_on} />
            <Field label="Joined" value={u.created_on} />
          </div>
        </div>
      )}

      {tab === "plan" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">Premium</p>
            <select aria-label="Premium plan" className={`${selectClass} w-full`} value={plan} onChange={(e) => setPlan(e.target.value)}>
              {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <Input aria-label="Premium days" className="h-11 w-24 flex-none" type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
              <span className="text-xs text-muted">days</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="primary" disabled={busy}
                onClick={() => run(() => grantPremium(chatId, { plan_type: plan, duration_days: Number(days), payment_provider: "manual" }), "Premium granted")}>
                Grant
              </Button>
              <Button disabled={busy}
                onClick={() => run(() => cancelPremium(chatId, "Cancelled from admin dashboard"), "Subscription cancelled")}>
                Cancel plan
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">Trial</p>
            <div className="flex items-center gap-2">
              <Input aria-label="Trial days" className="h-11 w-24 flex-none" type="number" min="1" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
              <span className="text-xs text-muted">trial days</span>
              <Button className="ml-auto" disabled={busy} onClick={() => run(() => startTrial(chatId, Number(trialDays)), "Trial started")}>
                Start trial
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">Settings</p>
            {settings.length === 0 && <p className="text-xs text-muted">No settings saved.</p>}
            {settings.map((s) => (
              <div key={s.setting_key} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate">{s.setting_key} = {String(s.setting_value)}</span>
                <Button size="sm" disabled={busy} onClick={() => run(() => deleteSetting(chatId, s.setting_key), `Deleted ${s.setting_key}`)}>
                  Delete
                </Button>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 pt-1">
              <Input aria-label="Setting key" className="h-11 min-w-0" placeholder="key" value={settingKey} onChange={(e) => setSettingKey(e.target.value)} />
              <Input aria-label="Setting value" className="h-11 min-w-0" placeholder="value" value={settingValue} onChange={(e) => setSettingValue(e.target.value)} />
              <Button variant="primary" disabled={busy || !settingKey}
                onClick={() => run(() => saveSetting(chatId, settingKey, { value: settingValue, type: "STRING" }), "Setting saved")}>
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">Recent activity</p>
            {events.length === 0 && <p className="text-xs text-muted">No events yet.</p>}
            {events.map((e) => (
              <div key={e.id} className="flex justify-between gap-2 py-1 text-xs">
                <span className="truncate">{e.event_name || e.event_type}</span>
                <span className="shrink-0 text-muted">{e.created_on}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && <p className="text-xs text-muted" role="status">{message}</p>}
      {loadError && <p className="status-error rounded-xl px-3 py-2 text-xs" role="alert">{loadError}</p>}
    </div>
  );
}

export function UserDetailSheet({ chatId, open, onClose }) {
  return (
    <BottomSheet
      description="Account status, premium plan, settings and recent activity."
      icon={<UserRound size={17} />}
      onClose={onClose}
      open={open}
      title="User details"
    >
      {chatId ? <UserDetailBody chatId={chatId} key={chatId} /> : null}
    </BottomSheet>
  );
}
