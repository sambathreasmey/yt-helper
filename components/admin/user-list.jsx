"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listUsers } from "@/services/dashboard-api";
import { ErrorText, formatUserName, selectClass } from "@/components/admin/ui";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "BLOCKED", label: "Blocked" },
];
const PLAN_OPTIONS = [
  { value: "", label: "All plans" },
  { value: "true", label: "Premium only" },
  { value: "false", label: "Non-premium" },
];

export function UserList({ onSelect, refreshKey }) {
  const [filters, setFilters] = useState({ search: "", status: "", is_premium: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Any filter change goes back to page 1.
  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const response = await listUsers({ ...filters, page, page_size: PAGE_SIZE });
      if (!active) return;
      setData(response.ok ? response.data : null);
      setError(response.ok ? "" : response.message);
    })();
    return () => { active = false; };
  }, [filters, page, refreshKey]);

  const totalPages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1;

  return (
    <Card className="space-y-3 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Input
          placeholder="Search name, username, chat ID"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
        <select className={selectClass} value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className={selectClass} value={filters.is_premium} onChange={(e) => updateFilter("is_premium", e.target.value)}>
          {PLAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <ErrorText>{error}</ErrorText>

      <div className="divide-y divide-border">
        {(data?.items || []).map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user.chat_id)}
            className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-surface"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{formatUserName(user)}</span>
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
        {data && data.items.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">No users found.</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <span className="text-xs text-muted">Page {page} of {totalPages} · {data?.total ?? 0} users</span>
        <Button size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </Card>
  );
}
