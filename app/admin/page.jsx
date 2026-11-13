"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Globe2, LayoutDashboard, LogOut, Megaphone, Send, ShieldCheck, Timer } from "lucide-react";
import { AppToast } from "@/components/app-toast";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Button } from "@/components/ui/button";
import { ThemePicker } from "@/components/theme-picker";
import { useGlobalAppSettings } from "@/hooks/use-global-app-settings";
import { useViewportLock } from "@/hooks/use-viewport-lock";
import { ActivitySheet, AdminLogin, SummaryTiles, useAdminSummary, isLoggedIn, logout } from "@/components/admin/admin-auth-summary";
import { UserList } from "@/components/admin/user-list";
import { UserDetailSheet } from "@/components/admin/user-detail-panel";
import { GoldPriceSheet, formatPrice, useAdminGoldPriceQuery } from "@/components/admin/gold-price-automation";
import { AutoRedirectSheet, useAutoRedirectQuery } from "@/components/admin/auto-redirect-setting";
import { AdvertisementSheet, useAdvertisementQuery } from "@/components/admin/advertisement-setting";
import { GlobalSettingsSheet } from "@/components/admin/global-app-settings";
import { MessageUserSheet } from "@/components/admin/telegram-user-notification";

function AdminTile({ icon: Icon, tone, title, status, state, onClick }) {
  return (
    <button className="admin-tile" data-tone={tone} onClick={onClick} type="button">
      <span aria-hidden="true" className="admin-tile-icon"><Icon size={19} /></span>
      <span className="min-w-0 flex-1 text-left">
        <b className="block truncate text-sm font-semibold">{title}</b>
        <small className="admin-tile-status">
          {state && <i aria-hidden="true" className="admin-dot" data-state={state} />}
          <span>{status}</span>
        </small>
      </span>
    </button>
  );
}

function AdminDashboard({ onSignOut }) {
  const queryClient = useQueryClient();
  useViewportLock(true);
  const [sheet, setSheet] = useState("gold");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [notice, setNotice] = useState("");
  const { summary, error } = useAdminSummary(true);
  const priceQuery = useAdminGoldPriceQuery();
  const globalQuery = useGlobalAppSettings();
  const redirectQuery = useAutoRedirectQuery();
  const adQuery = useAdvertisementQuery();

  const open = useCallback((kind) => { setSheet(kind); setSheetOpen(true); }, []);
  const close = useCallback(() => setSheetOpen(false), []);
  const saved = useCallback((message) => { setNotice(message); setSheetOpen(false); }, []);
  const clearNotice = useCallback(() => setNotice(""), []);
  const refreshAll = useCallback(() => queryClient.refetchQueries({ type: "active" }), [queryClient]);

  const globalSettings = globalQuery.data;
  const redirectSeconds = redirectQuery.data?.seconds;
  const price = priceQuery.data ? formatPrice(priceQuery.data.price_per_damlung) : null;
  const sheetProps = { onClose: close, onSaved: saved };

  return (
    <PullToRefresh onRefresh={refreshAll}>
      <main className="admin-page mx-auto w-full max-w-[1100px] space-y-3 p-2 sm:space-y-4 sm:p-4">
        <header className="admin-toolbar relative z-[60] flex items-center justify-between gap-3 rounded-[28px] border border-border px-4 py-3 shadow-glass sm:px-5">
          <div className="admin-toolbar-brand flex min-w-0 items-center gap-3">
            <span className="admin-toolbar-icon" aria-hidden="true"><LayoutDashboard size={21} /></span>
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">Helper Management</h1>
              <p className="mt-0.5 text-[11px] text-muted sm:text-xs">Admin dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemePicker />
            <Button size="sm" onClick={onSignOut}><LogOut aria-hidden="true" size={15} /><span className="hidden sm:inline">Sign out</span></Button>
          </div>
        </header>

        {error && <p className="status-error flex items-center gap-2 rounded-xl px-3 py-2 text-xs" role="alert"><ShieldCheck aria-hidden="true" size={16} />{error}</p>}

        <SummaryTiles onOpenActivity={() => open("activity")} summary={summary} />

        <section aria-label="Manage the app" className="admin-tiles">
          <AdminTile
            icon={Coins}
            onClick={() => open("gold")}
            state={globalSettings ? (globalSettings.github_gold_price_updates_enabled ? "on" : "off") : undefined}
            status={`${globalSettings?.github_gold_price_updates_enabled ? "Auto-update on" : "Auto-update off"}${price ? ` · ${price}` : ""}`}
            title="Gold feed"
            tone="gold"
          />
          <AdminTile
            icon={Timer}
            onClick={() => open("redirect")}
            state={redirectSeconds === undefined ? undefined : redirectSeconds > 0 ? "on" : "off"}
            status={redirectSeconds === undefined ? "Loading…" : redirectSeconds > 0 ? `${redirectSeconds}s delay` : "Off"}
            title="Redirect"
            tone="cyan"
          />
          <AdminTile
            icon={Megaphone}
            onClick={() => open("ad")}
            state={adQuery.data ? (adQuery.data.enabled ? "on" : "off") : undefined}
            status={adQuery.data ? (adQuery.data.enabled ? "Live on YouTube home" : "Hidden") : adQuery.isError ? "Unavailable" : "Loading…"}
            title="Ad banner"
            tone="violet"
          />
          <AdminTile
            icon={Globe2}
            onClick={() => open("global")}
            state={globalSettings ? (globalSettings.maintenance_mode ? "warn" : "on") : undefined}
            status={globalSettings ? (globalSettings.maintenance_mode ? "Maintenance ON" : "App is live") : "Loading…"}
            title="App settings"
            tone="blue"
          />
          <AdminTile icon={Send} onClick={() => open("message")} status="Private Telegram message" title="Message a user" tone="green" />
        </section>

        <UserList onSelect={(chatId) => { setSelectedChatId(chatId); open("user"); }} />
      </main>

      <GoldPriceSheet {...sheetProps} open={sheetOpen && sheet === "gold"} />
      <AutoRedirectSheet {...sheetProps} open={sheetOpen && sheet === "redirect"} />
      <AdvertisementSheet {...sheetProps} open={sheetOpen && sheet === "ad"} />
      <GlobalSettingsSheet {...sheetProps} open={sheetOpen && sheet === "global"} />
      <MessageUserSheet {...sheetProps} open={sheetOpen && sheet === "message"} />
      <ActivitySheet onClose={close} open={sheetOpen && sheet === "activity"} summary={summary} />
      <UserDetailSheet chatId={selectedChatId} onClose={close} open={sheetOpen && sheet === "user"} />
      <AppToast message={notice} onDone={clearNotice} />
    </PullToRefresh>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!loggedIn) return <AdminLogin onLoggedIn={() => setLoggedIn(true)} />;

  return (
    <AdminDashboard
      onSignOut={() => {
        logout();
        queryClient.removeQueries({ queryKey: ["admin"] });
        setLoggedIn(false);
      }}
    />
  );
}
