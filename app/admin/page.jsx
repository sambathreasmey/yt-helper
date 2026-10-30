"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminLogin, SummaryCards, useAdminSummary, isLoggedIn, logout } from "@/components/admin/admin-auth-summary";
import { UserList } from "@/components/admin/user-list";
import { UserDetail } from "@/components/admin/user-detail";

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { summary, error, load } = useAdminSummary();

  useEffect(() => {
    const ok = isLoggedIn();
    setLoggedIn(ok);
    setReady(true);
    if (ok) load();
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    load();
  }, [load]);

  if (!ready) return null;

  if (!loggedIn) {
    return <AdminLogin onLoggedIn={() => { setLoggedIn(true); load(); }} />;
  }

  return (
    <main className="mx-auto w-full max-w-[720px] space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-base font-semibold">Telegram users</h1>
        <Button size="sm" onClick={() => { logout(); setLoggedIn(false); }}>Sign out</Button>
      </header>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {selectedChatId ? (
        <UserDetail chatId={selectedChatId} onChanged={refresh} onBack={() => setSelectedChatId(null)} />
      ) : (
        <>
          <SummaryCards summary={summary} />
          <UserList onSelect={setSelectedChatId} refreshKey={refreshKey} />
        </>
      )}
    </main>
  );
}
