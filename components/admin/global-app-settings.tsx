"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Globe2, Save, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function GlobalAppSettings() {
  const queryClient = useQueryClient();
  const settingsQuery = useGlobalAppSettings();
  const [settings, setSettings] = useState(DEFAULT_GLOBAL_APP_SETTINGS);
  const saveMutation = useMutation({
    mutationFn: async (value: GlobalAppSettingsData) => {
      const response = await updateGlobalAppSettings(value);
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to save global app settings");
      }
      return response.data;
    },
    onSuccess: async (savedSettings) => {
      setSettings(savedSettings);
      queryClient.setQueryData(GLOBAL_APP_SETTINGS_QUERY_KEY, savedSettings);
      await queryClient.invalidateQueries({ queryKey: GLOBAL_APP_SETTINGS_QUERY_KEY });
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
    (Object.keys(settings) as (keyof GlobalAppSettingsData)[])
      .every((key) => settings[key] === savedSettings?.[key]);

  function sendBroadcast(kind: TelegramBroadcastKind) {
    const label = kind === "maintenance" ? "maintenance notice" : "app-wide announcement";
    if (window.confirm(`Send the saved ${label} to all active Telegram users now? This cannot be undone.`)) {
      broadcastMutation.mutate(kind);
    }
  }

  return (
    <Card className="admin-global-card">
      <CardHeader>
        <div className="admin-section-heading">
          <span className="admin-heading-icon admin-heading-cyan" aria-hidden="true">
            <Globe2 size={18} />
          </span>
          <div>
            <CardTitle>Global app settings</CardTitle>
            <CardDescription>Control app availability, shared notices, features, support, and defaults.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="admin-global-form" onSubmit={submit}>
          <section className="admin-global-group">
            <h3>Maintenance mode</h3>
            <label className="admin-global-toggle">
              <input
                checked={settings.maintenance_mode}
                onChange={(event) => setSettings((current) => ({ ...current, maintenance_mode: event.target.checked }))}
                type="checkbox"
              />
              <span>Temporarily pause the user app (Admin remains accessible)</span>
            </label>
            <label className="admin-ad-field">
              <span>Maintenance message</span>
              <textarea
                className="admin-ad-message"
                maxLength={500}
                onChange={(event) => setSettings((current) => ({ ...current, maintenance_message: event.target.value }))}
                required={settings.maintenance_mode}
                rows={2}
                value={settings.maintenance_message}
              />
            </label>
            <Button
              className="admin-notification-button"
              disabled={!settingsQuery.data?.maintenance_mode || !draftIsSaved || broadcastMutation.isPending}
              onClick={() => sendBroadcast("maintenance")}
              type="button"
              variant="outline"
            >
              <Send aria-hidden="true" size={15} />
              {broadcastMutation.isPending && broadcastMutation.variables === "maintenance"
                ? "Sending…"
                : "Send maintenance notice on Telegram"}
            </Button>
          </section>

          <section className="admin-global-group">
            <h3>App-wide announcement</h3>
            <label className="admin-global-toggle">
              <input
                checked={settings.announcement_enabled}
                onChange={(event) => setSettings((current) => ({ ...current, announcement_enabled: event.target.checked }))}
                type="checkbox"
              />
              <span>Show an announcement across user pages</span>
            </label>
            <label className="admin-ad-field">
              <span>Announcement title</span>
              <Input
                maxLength={100}
                onChange={(event) => setSettings((current) => ({ ...current, announcement_title: event.target.value }))}
                required={settings.announcement_enabled}
                value={settings.announcement_title}
              />
            </label>
            <label className="admin-ad-field">
              <span>Announcement message</span>
              <textarea
                className="admin-ad-message"
                maxLength={1000}
                onChange={(event) => setSettings((current) => ({ ...current, announcement_message: event.target.value }))}
                required={settings.announcement_enabled}
                rows={3}
                value={settings.announcement_message}
              />
            </label>
            <label className="admin-ad-field">
              <span>Announcement link <small>(optional)</small></span>
              <Input
                maxLength={2048}
                onChange={(event) => setSettings((current) => ({ ...current, announcement_link_url: event.target.value }))}
                placeholder="https://example.com"
                type="url"
                value={settings.announcement_link_url}
              />
            </label>
            <Button
              className="admin-notification-button"
              disabled={!settingsQuery.data?.announcement_enabled || !draftIsSaved || broadcastMutation.isPending}
              onClick={() => sendBroadcast("announcement")}
              type="button"
              variant="outline"
            >
              <Send aria-hidden="true" size={15} />
              {broadcastMutation.isPending && broadcastMutation.variables === "announcement"
                ? "Sending…"
                : "Send announcement on Telegram"}
            </Button>
          </section>

          <section className="admin-global-group">
            <h3>Features and defaults</h3>
            <div className="admin-global-feature-grid">
              <label className="admin-global-toggle">
                <input
                  checked={settings.youtube_enabled}
                  onChange={(event) => setSettings((current) => ({ ...current, youtube_enabled: event.target.checked }))}
                  type="checkbox"
                />
                <span>YouTube Helper</span>
              </label>
              <label className="admin-global-toggle">
                <input
                  checked={settings.gold_trade_enabled}
                  onChange={(event) => setSettings((current) => ({ ...current, gold_trade_enabled: event.target.checked }))}
                  type="checkbox"
                />
                <span>Gold Trade</span>
              </label>
            </div>
            {!settings.maintenance_mode && !settings.youtube_enabled && !settings.gold_trade_enabled && (
              <p className="admin-ad-error" role="alert">Keep at least one feature enabled, or turn on maintenance mode.</p>
            )}
            <label className="admin-ad-field">
              <span>Support link <small>(optional)</small></span>
              <Input
                maxLength={2048}
                onChange={(event) => setSettings((current) => ({ ...current, support_url: event.target.value }))}
                placeholder="https://t.me/your-support"
                type="url"
                value={settings.support_url}
              />
            </label>
            <label className="admin-ad-field">
              <span>Default language <small>(used only when a user has not selected one)</small></span>
              <select
                className="admin-global-select"
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "KH" || value === "EN" || value === "CN") {
                    setSettings((current) => ({ ...current, default_language: value }));
                  }
                }}
                value={settings.default_language}
              >
                <option value="KH">Khmer</option>
                <option value="EN">English</option>
                <option value="CN">Chinese</option>
              </select>
            </label>
          </section>

          <div className="admin-ad-footer">
            <p className="text-xs text-muted">Changes are shared with all users. URLs must use HTTP or HTTPS.</p>
            <Button disabled={!valid || saveMutation.isPending || settingsQuery.isPending || settingsQuery.isError} type="submit" variant="primary">
              <Save aria-hidden="true" size={16} />
              {saveMutation.isPending ? "Saving…" : "Save global settings"}
            </Button>
          </div>
        </form>

        {settingsQuery.error && <p className="admin-ad-error" role="alert">{settingsQuery.error.message}</p>}
        {saveMutation.error && <p className="admin-ad-error" role="alert">{saveMutation.error.message}</p>}
        {saveMutation.isSuccess && <p className="admin-ad-success" role="status">Global settings saved.</p>}
        {broadcastMutation.error && <p className="admin-ad-error" role="alert">{broadcastMutation.error.message}</p>}
        {broadcastMutation.data && (
          <p className={broadcastMutation.data.result.failed ? "admin-ad-error" : "admin-ad-success"} role="status">
            Telegram broadcast: {broadcastMutation.data.result.sent} sent, {broadcastMutation.data.result.failed} failed
            {`, ${broadcastMutation.data.result.total} active users.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
