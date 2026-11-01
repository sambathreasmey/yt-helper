"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemePicker } from "@/components/theme-picker";
import { AdminLogin, SummaryCards, useAdminSummary, isLoggedIn, logout } from "@/components/admin/admin-auth-summary";
import { UserList } from "@/components/admin/user-list";
import { UserDetailPanel } from "@/components/admin/user-detail-panel";
import { GoldPriceForm } from "@/components/admin/gold-price-form";
import { AutoRedirectSetting } from "@/components/admin/auto-redirect-setting";
import { AdvertisementSetting } from "@/components/admin/advertisement-setting";
import { GlobalAppSettings } from "@/components/admin/global-app-settings";
import { TelegramUserNotification } from "@/components/admin/telegram-user-notification";

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const { summary, error } = useAdminSummary(loggedIn);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!loggedIn) {
    return <AdminLogin onLoggedIn={() => setLoggedIn(true)} />;
  }

  return (
    <main className="admin-page mx-auto w-full max-w-[1100px] space-y-4 p-2 sm:space-y-5 sm:p-4">
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
          <Button size="sm" onClick={() => {
            logout();
            queryClient.removeQueries({ queryKey: ["admin"] });
            setLoggedIn(false);
          }}><LogOut aria-hidden="true" size={15} /><span className="hidden sm:inline">Sign out</span></Button>
        </div>
      </header>

      {error && <p className="admin-error text-xs text-red-400"><ShieldCheck aria-hidden="true" size={16} />{error}</p>}

      <GoldPriceForm />
      <AutoRedirectSetting />
      <AdvertisementSetting />
      <GlobalAppSettings />
      <TelegramUserNotification />

      {selectedChatId ? (
        <UserDetailPanel chatId={selectedChatId} onBack={() => setSelectedChatId(null)} />
      ) : (
        <>
          <SummaryCards summary={summary} />
          <UserList onSelect={setSelectedChatId} />
        </>
      )}
    </main>
  );
}
