"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  cancelPremium, deleteSetting, getUserDetail, getUserEvents,
  grantPremium, saveSetting, setUserStatus, startTrial,
} from "@/services/dashboard-api";
import { useAdminAction } from "@/hooks/use-admin-action";
import { ErrorText, Field, Notice, Section, formatUserName, selectClass } from "@/components/admin/ui";

const PLANS = ["PREMIUM_MONTHLY", "PREMIUM_YEARLY", "PREMIUM_LIFETIME"];
const STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"];

export function UserDetailPanel({ chatId, onChanged, onBack }) {
  const [detail, setDetail] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [plan, setPlan] = useState(PLANS[0]);
  const [days, setDays] = useState("30");
  const [trialDays, setTrialDays] = useState("7");
  const [settingKey, setSettingKey] = useState("");
  const [settingValue, setSettingValue] = useState("");

  const load = useCallback(async () => {
    const [detailRes, eventsRes] = await Promise.all([
      getUserDetail(chatId),
      getUserEvents(chatId, { limit: 20 }),
    ]);
    if (detailRes.ok) {
      setDetail(detailRes.data);
      setLoadError("");
    } else {
      setLoadError(detailRes.message);
    }
    if (eventsRes.ok) setEvents(eventsRes.data || []);
  }, [chatId]);

  // Reload after every successful action, then tell the parent so the list refreshes.
  const onActionSuccess = useCallback(async () => {
    await load();
    onChanged?.();
  }, [load, onChanged]);

  const { busy, message, run } = useAdminAction(onActionSuccess);

  useEffect(() => { load(); }, [load]);

  if (!detail) {
    return (
      <Card className="p-4">
        <Button size="sm" onClick={onBack}>Back</Button>
        <p className="mt-3 text-sm text-muted">{loadError || "Loading..."}</p>
      </Card>
    );
  }

  const { user: u, subscription, session_stats: stats = {}, referrals = {} } = detail;
  const sub = subscription || {};

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={onBack}>Back to users</Button>

      <Card className="p-4">
        <p className="text-sm font-semibold">{formatUserName(u)}</p>
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
          <Field label="Referrals" value={`${referrals.total ?? 0} (${referrals.completed ?? 0} completed)`} />
          <Field label="Last active" value={u.last_active_on} />
          <Field label="Joined" value={u.created_on} />
        </div>
      </Card>

      <Section title="Account status">
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
      </Section>

      <Section title="Premium and trial">
        <div className="flex flex-wrap items-center gap-2">
          <select className={selectClass} value={plan} onChange={(e) => setPlan(e.target.value)}>
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
      </Section>

      <Section title="Settings">
        {detail.settings.length === 0 && <Notice>No settings saved.</Notice>}
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
      </Section>

      <Section title="Recent activity">
        {events.length === 0 && <Notice>No events yet.</Notice>}
        {events.map((e) => (
          <div key={e.id} className="flex justify-between gap-2 py-1 text-xs">
            <span className="truncate">{e.event_name || e.event_type}</span>
            <span className="shrink-0 text-muted">{e.created_on}</span>
          </div>
        ))}
      </Section>

      <Notice>{message}</Notice>
      <ErrorText>{loadError}</ErrorText>
    </div>
  );
}
