"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  cancelPremium, deleteSetting, getUserDetail, getUserEvents,
  grantPremium, saveSetting, setUserStatus, startTrial,
} from "@/services/dashboard-api";

const PLANS = ["PREMIUM_MONTHLY", "PREMIUM_YEARLY", "PREMIUM_LIFETIME"];
const STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"];

function Field({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-xs">
      <span className="text-muted">{label}</span>
      <span className="truncate text-right">{value ?? "-"}</span>
    </div>
  );
}

export function UserDetail({ chatId, onChanged, onBack }) {
  const [detail, setDetail] = useState(null);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState("PREMIUM_MONTHLY");
  const [days, setDays] = useState("30");
  const [trialDays, setTrialDays] = useState("7");
  const [settingKey, setSettingKey] = useState("");
  const [settingValue, setSettingValue] = useState("");

  async function load() {
    const [detailRes, eventsRes] = await Promise.all([
      getUserDetail(chatId),
      getUserEvents(chatId, { limit: 20 }),
    ]);
    if (detailRes.ok) setDetail(detailRes.data);
    else setMessage(detailRes.message);
    if (eventsRes.ok) setEvents(eventsRes.data || []);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [chatId]);

  async function run(action, successText) {
    setBusy(true);
    setMessage("");
    const response = await action();
    setBusy(false);
    setMessage(response.ok ? successText : response.message);
    if (response.ok) {
      await load();
      onChanged?.();
    }
  }

  if (!detail) {
    return (
      <Card className="p-4">
        <Button size="sm" onClick={onBack}>Back</Button>
        <p className="mt-3 text-sm text-muted">{message || "Loading..."}</p>
      </Card>
    );
  }

  const u = detail.user;
  const sub = detail.subscription || {};
  const stats = detail.session_stats || {};
  const refs = detail.referrals || {};

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={onBack}>Back to users</Button>

      <Card className="p-4">
        <p className="text-sm font-semibold">
          {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.chat_id}
        </p>
        <p className="text-xs text-muted">{u.username ? `@${u.username}` : "No username"} · chat {u.chat_id}</p>
        <div className="mt-3 divide-y divide-border">
          <Field label="Status" value={u.status} />
          <Field label="Premium flag" value={u.is_premium ? "Yes" : "No"} />
          <Field label="Language" value={u.language_code} />
          <Field label="Plan" value={sub.plan_type} />
          <Field label="Plan status" value={sub.status} />
          <Field label="Plan ends" value={sub.subscription_ends_on} />
          <Field label="Trial ends" value={sub.trial_ends_on} />
          <Field label="Sessions" value={stats.total_sessions} />
          <Field label="Total time (s)" value={stats.total_duration_seconds} />
          <Field label="Last session" value={stats.last_session} />
          <Field label="Referrals" value={`${refs.total ?? 0} (${refs.completed ?? 0} completed)`} />
          <Field label="Last active" value={u.last_active_on} />
          <Field label="Joined" value={u.created_on} />
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">Account status</p>
        <div className="flex flex-wrap gap-2">
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
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">Premium and trial</p>
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-11 rounded-xl border border-border bg-surface-strong px-3 text-sm" value={plan} onChange={(e) => setPlan(e.target.value)}>
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <Input className="h-11 w-24 flex-none" type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
          <span className="text-xs text-muted">days</span>
          <Button size="sm" variant="primary" disabled={busy}
            onClick={() => run(() => grantPremium(chatId, { plan_type: plan, duration_days: Number(days), payment_provider: "manual" }), "Premium granted")}>
            Grant
          </Button>
          <Button size="sm" disabled={busy}
            onClick={() => run(() => cancelPremium(chatId, "Cancelled from admin dashboard"), "Subscription cancelled")}>
            Cancel plan
          </Button>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Input className="h-11 w-24 flex-none" type="number" min="1" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
          <span className="text-xs text-muted">trial days</span>
          <Button size="sm" disabled={busy}
            onClick={() => run(() => startTrial(chatId, Number(trialDays)), "Trial started")}>
            Start trial
          </Button>
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">Settings</p>
        {detail.settings.length === 0 && <p className="text-xs text-muted">No settings saved.</p>}
        {detail.settings.map((s) => (
          <div key={s.setting_key} className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate">{s.setting_key} = {String(s.setting_value)}</span>
            <Button size="sm" disabled={busy}
              onClick={() => run(() => deleteSetting(chatId, s.setting_key), `Deleted ${s.setting_key}`)}>
              Delete
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          <Input className="h-11 w-36 flex-none" placeholder="key" value={settingKey} onChange={(e) => setSettingKey(e.target.value)} />
          <Input className="h-11 w-36 flex-none" placeholder="value" value={settingValue} onChange={(e) => setSettingValue(e.target.value)} />
          <Button size="sm" variant="primary" disabled={busy || !settingKey}
            onClick={() => run(() => saveSetting(chatId, settingKey, { value: settingValue, type: "STRING" }), "Setting saved")}>
            Save
          </Button>
        </div>
      </Card>

      <Card className="space-y-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">Recent activity</p>
        {events.length === 0 && <p className="text-xs text-muted">No events yet.</p>}
        {events.map((e) => (
          <div key={e.id} className="flex justify-between gap-2 py-1 text-xs">
            <span className="truncate">{e.event_name || e.event_type}</span>
            <span className="shrink-0 text-muted">{e.created_on}</span>
          </div>
        ))}
      </Card>

      {message && <p className="text-xs text-muted">{message}</p>}
    </div>
  );
}
