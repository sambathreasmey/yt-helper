"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThemePicker } from "@/components/theme-picker";
import { AdminLogin, SummaryCards, useAdminSummary, isLoggedIn, logout } from "@/components/admin/admin-auth-summary";
import { UserList } from "@/components/admin/user-list";
import { UserDetailPanel } from "@/components/admin/user-detail-panel";
import { GoldPriceForm } from "@/components/admin/gold-price-form";

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
    <main className="mx-auto w-full max-w-[920px] space-y-4 p-2 sm:space-y-5 sm:p-4">
      <header className="admin-toolbar flex items-center justify-between gap-3 rounded-[28px] border border-border px-4 py-3 shadow-glass sm:px-5">
        <div>
          <h1 className="text-base font-semibold tracking-tight sm:text-lg">Telegram users</h1>
          <p className="mt-0.5 text-[11px] text-muted sm:text-xs">Admin dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemePicker />
          <Button size="sm" onClick={() => {
            logout();
            queryClient.removeQueries({ queryKey: ["admin"] });
            setLoggedIn(false);
          }}>Sign out</Button>
        </div>
      </header>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <GoldPriceForm />

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
