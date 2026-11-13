"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Globe2, Save, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/components/bottom-sheet";
import { SheetTabs } from "@/components/sheet-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGlobalAppSettings } from "@/hooks/use-global-app-settings";
import {
  DEFAULT_GLOBAL_APP_SETTINGS,
  GLOBAL_APP_SETTINGS_QUERY_KEY,
  sendGlobalTelegramNotification,
  updateGlobalAppSettings,
  type GlobalAppSettings as GlobalAppSettingsData,
  type TelegramBroadcastKind,
} from "@/services/dashboard-api";

type Tab = "maintenance" | "announcement" | "features";
const TABS: { id: Tab; label: string }[] = [
  { id: "maintenance", label: "Maintenance" },
  { id: "announcement", label: "Announcement" },
  { id: "features", label: "Features" },
];

function GlobalSettingsForm({ onSaved }: { onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const settingsQuery = useGlobalAppSettings();
  const [settings, setSettings] = useState<GlobalAppSettingsData>(settingsQuery.data ?? DEFAULT_GLOBAL_APP_SETTINGS);
  const [tab, setTab] = useState<Tab>("maintenance");
  const saveMutation = useMutation({
    mutationFn: async (value: GlobalAppSettingsData) => {
      const response = await updateGlobalAppSettings(value);
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to save global app settings");
      }
      return response.data;
    },
    onSuccess: async (savedSettings) => {
      queryClient.setQueryData(GLOBAL_APP_SETTINGS_QUERY_KEY, savedSettings);
      await queryClient.invalidateQueries({ queryKey: GLOBAL_APP_SETTINGS_QUERY_KEY });
      onSaved("Global settings saved.");
    },
  });
  const broadcastMutation = useMutation({
    mutationFn: async (kind: TelegramBroadcastKind) => {
      const response = await sendGlobalTelegramNotification(kind);
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to send Telegram notification");
      }
      return { kind, result: response.data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GLOBAL_APP_SETTINGS_QUERY_KEY });
    },
  });

  useEffect(() => {
    if (settingsQuery.data) setSettings(settingsQuery.data);
  }, [settingsQuery.data]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveMutation.mutate({
      ...settings,
      maintenance_message: settings.maintenance_message.trim(),
      announcement_title: settings.announcement_title.trim(),
      announcement_message: settings.announcement_message.trim(),
      announcement_link_url: settings.announcement_link_url.trim(),
      support_url: settings.support_url.trim(),
    });
  }

  const valid =
    (settings.maintenance_mode || settings.youtube_enabled || settings.gold_trade_enabled) &&
    (!settings.maintenance_mode || Boolean(settings.maintenance_message.trim())) &&
    (!settings.announcement_enabled || Boolean(settings.announcement_title.trim() && settings.announcement_message.trim()));
  const savedSettings = settingsQuery.data;
  const draftIsSaved = Boolean(savedSettings) &&
    (Object.keys(settings) as (keyof GlobalAppSettingsData)[]).every((key) => settings[key] === savedSettings?.[key]);
  const update = (patch: Partial<GlobalAppSettingsData>) => setSettings((current) => ({ ...current, ...patch }));

  function sendBroadcast(kind: TelegramBroadcastKind) {
    const label = kind === "maintenance" ? "maintenance notice" : "app-wide announcement";
    if (window.confirm(`Send the saved ${label} to all active Telegram users now? This cannot be undone.`)) {
      broadcastMutation.mutate(kind);
    }
  }

  // Tell the admin which tab holds a problem, since only one tab is visible at a time.
  const problems: Record<Tab, boolean> = {
    maintenance: settings.maintenance_mode && !settings.maintenance_message.trim(),
    announcement: settings.announcement_enabled && !(settings.announcement_title.trim() && settings.announcement_message.trim()),
    features: !settings.maintenance_mode && !settings.youtube_enabled && !settings.gold_trade_enabled,
  };
  const tabs = TABS.map((item) => ({ ...item, label: problems[item.id] ? `${item.label} •` : item.label }));

  return (
    <form className="space-y-3" onSubmit={submit}>
      <SheetTabs onChange={setTab} tabs={tabs} value={tab} />

      {tab === "maintenance" && (
        <div className="space-y-3">
          <label className="admin-global-toggle">
            <input checked={settings.maintenance_mode} onChange={(event) => update({ maintenance_mode: event.target.checked })} type="checkbox" />
            <span>Temporarily pause the user app (Admin remains accessible)</span>
          </label>
          <label className="admin-ad-field">
            <span>Maintenance message</span>
            <textarea
              className="admin-ad-message"
              maxLength={500}
              onChange={(event) => update({ maintenance_message: event.target.value })}
              rows={3}
              value={settings.maintenance_message}
            />
          </label>
          <Button
            className="w-full"
            disabled={!settingsQuery.data?.maintenance_mode || !draftIsSaved || broadcastMutation.isPending}
            onClick={() => sendBroadcast("maintenance")}
            type="button"
            variant="outline"
          >
            <Send aria-hidden="true" size={15} />
            {broadcastMutation.isPending && broadcastMutation.variables === "maintenance" ? "Sending…" : "Send maintenance notice on Telegram"}
          </Button>
        </div>
      )}

      {tab === "announcement" && (
        <div className="space-y-3">
          <label className="admin-global-toggle">
            <input checked={settings.announcement_enabled} onChange={(event) => update({ announcement_enabled: event.target.checked })} type="checkbox" />
            <span>Show an announcement across user pages</span>
          </label>
          <label className="admin-ad-field">
            <span>Announcement title</span>
            <Input maxLength={100} onChange={(event) => update({ announcement_title: event.target.value })} value={settings.announcement_title} />
          </label>
          <label className="admin-ad-field">
            <span>Announcement message</span>
            <textarea
              className="admin-ad-message"
              maxLength={1000}
              onChange={(event) => update({ announcement_message: event.target.value })}
              rows={3}
              value={settings.announcement_message}
            />
          </label>
          <label className="admin-ad-field">
            <span>Announcement link <small>(optional)</small></span>
            <Input maxLength={2048} onChange={(event) => update({ announcement_link_url: event.target.value })} placeholder="https://example.com" type="url" value={settings.announcement_link_url} />
          </label>
          <Button
            className="w-full"
            disabled={!settingsQuery.data?.announcement_enabled || !draftIsSaved || broadcastMutation.isPending}
            onClick={() => sendBroadcast("announcement")}
            type="button"
            variant="outline"
          >
            <Send aria-hidden="true" size={15} />
            {broadcastMutation.isPending && broadcastMutation.variables === "announcement" ? "Sending…" : "Send announcement on Telegram"}
          </Button>
        </div>
      )}

      {tab === "features" && (
        <div className="space-y-3">
          <div className="admin-global-feature-grid">
            <label className="admin-global-toggle">
              <input checked={settings.youtube_enabled} onChange={(event) => update({ youtube_enabled: event.target.checked })} type="checkbox" />
              <span>YouTube Helper</span>
            </label>
            <label className="admin-global-toggle">
              <input checked={settings.gold_trade_enabled} onChange={(event) => update({ gold_trade_enabled: event.target.checked })} type="checkbox" />
              <span>Gold Trade</span>
            </label>
          </div>
          {problems.features && (
            <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">Keep at least one feature enabled, or turn on maintenance mode.</p>
          )}
          <label className="admin-ad-field">
            <span>Support link <small>(optional)</small></span>
            <Input maxLength={2048} onChange={(event) => update({ support_url: event.target.value })} placeholder="https://t.me/your-support" type="url" value={settings.support_url} />
          </label>
          <label className="admin-ad-field">
            <span>Default language <small>(used only when a user has not selected one)</small></span>
            <select
              className="admin-global-select"
              onChange={(event) => {
                const value = event.target.value;
                if (value === "KH" || value === "EN" || value === "CN") update({ default_language: value });
              }}
              value={settings.default_language}
            >
              <option value="KH">Khmer</option>
              <option value="EN">English</option>
              <option value="CN">Chinese</option>
            </select>
          </label>
        </div>
      )}

      <p className="text-xs text-muted">Changes are shared with all users. URLs must use HTTP or HTTPS.</p>
      {settingsQuery.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{settingsQuery.error.message}</p>}
      {saveMutation.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{saveMutation.error.message}</p>}
      {broadcastMutation.error && <p className="status-error rounded-xl px-3 py-2 text-sm" role="alert">{broadcastMutation.error.message}</p>}
      {broadcastMutation.data && (
        <p className={broadcastMutation.data.result.failed ? "status-error rounded-xl px-3 py-2 text-sm" : "pl-up text-sm"} role="status">
          Telegram broadcast: {broadcastMutation.data.result.sent} sent, {broadcastMutation.data.result.failed} failed
          {`, ${broadcastMutation.data.result.total} active users.`}
        </p>
      )}
      <Button className="w-full" disabled={!valid || saveMutation.isPending || settingsQuery.isPending || settingsQuery.isError} type="submit" variant="primary">
        <Save aria-hidden="true" size={16} />
        {saveMutation.isPending ? "Saving…" : "Save global settings"}
      </Button>
    </form>
  );
}

export function GlobalSettingsSheet({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (message: string) => void }) {
  return (
    <BottomSheet
      description="Control app availability, shared notices, features, support, and defaults."
      icon={<Globe2 size={17} />}
      onClose={onClose}
      open={open}
      title="Global app settings"
    >
      <GlobalSettingsForm onSaved={onSaved} />
    </BottomSheet>
  );
}
