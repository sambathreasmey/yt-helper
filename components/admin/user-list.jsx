"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listUsers } from "@/services/dashboard-api";

const STATUS_OPTIONS = ["", "ACTIVE", "INACTIVE", "BLOCKED"];

export function UserList({ onSelect, refreshKey }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [premium, setPremium] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const response = await listUsers({
        search,
        status,
        is_premium: premium,
        page,
        page_size: pageSize,
      });
      if (!active) return;
      if (response.ok) {
        setData(response.data);
        setError("");
      } else {
        setError(response.message);
      }
    })();
    return () => { active = false; };
  }, [search, status, premium, page, pageSize, refreshKey]);

  const totalPages = data ? Math.max(Math.ceil(data.total / pageSize), 1) : 1;

  return (
    <Card className="space-y-3 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input
          placeholder="Search name, username, chat ID"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="h-12 rounded-xl border border-border bg-surface-strong px-3 text-sm"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
        <select
          className="h-12 rounded-xl border border-border bg-surface-strong px-3 text-sm"
          value={premium}
          onChange={(e) => { setPremium(e.target.value); setPage(1); }}
        >
          <option value="">All plans</option>
          <option value="true">Premium only</option>
          <option value="false">Non-premium</option>
        </select>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="divide-y divide-border">
        {(data?.items || []).map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user.chat_id)}
            className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-surface"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || user.chat_id}
              </span>
              <span className="block truncate text-xs text-muted">
                {user.username ? `@${user.username}` : user.chat_id} · {user.plan_type || "FREE"}
              </span>
            </span>
            <span className="shrink-0 text-right text-[11px] text-muted">
              <span className="block">{user.status}</span>
              <span className="block">{user.total_sessions} sessions</span>
            </span>
          </button>
        ))}
        {data && data.items.length === 0 && <p className="py-6 text-center text-sm text-muted">No users found.</p>}
      </div>

      <div className="flex items-center justify-between">
        <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <span className="text-xs text-muted">Page {page} of {totalPages} · {data?.total ?? 0} users</span>
        <Button size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </Card>
  );
}
