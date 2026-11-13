"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listUsers } from "@/services/dashboard-api";
import { formatUserName, selectClass } from "@/components/admin/ui";

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

function initials(user) {
  return formatUserName(user).replace(/^@/, "").trim().slice(0, 1).toUpperCase() || "?";
}

export function UserList({ onSelect }) {
  const [filters, setFilters] = useState({ search: "", status: "", is_premium: "" });
  const [page, setPage] = useState(1);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", filters, page, PAGE_SIZE],
    queryFn: async () => {
      const response = await listUsers({ ...filters, page, page_size: PAGE_SIZE });
      if (!response.ok || !response.data) {
        throw new Error(response.message || "Unable to load users");
      }
      return response.data;
    },
  });
  const data = usersQuery.data;

  // Any filter change goes back to page 1.
  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  const totalPages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1;

  return (
    <Card className="admin-users-card p-0">
      <div className="admin-users-head">
        <div className="admin-users-title">
          <span className="admin-heading-icon admin-heading-violet" aria-hidden="true"><Users size={17} /></span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Telegram users</h2>
            <p className="text-[11px] text-muted">{data?.total ?? 0} accounts · tap one to manage</p>
          </div>
        </div>
        <span className="admin-search-field">
          <Search aria-hidden="true" size={17} />
          <Input
            aria-label="Search users"
            placeholder="Search name, username, chat ID"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </span>
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="Filter by status" className={selectClass} value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select aria-label="Filter by plan" className={selectClass} value={filters.is_premium} onChange={(e) => updateFilter("is_premium", e.target.value)}>
            {PLAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {usersQuery.error && <p className="status-error mx-3 rounded-xl px-3 py-2 text-xs" role="alert">{usersQuery.error.message}</p>}

      <div className="gold-list-body">
        {usersQuery.isPending && <p className="py-6 text-center text-sm text-muted">Loading users...</p>}
        {(data?.items || []).map((user) => (
          <button className="gold-holding-row admin-user-row" key={user.id} onClick={() => onSelect(user.chat_id)} type="button">
            <span aria-hidden="true" className="gold-row-badge">{initials(user)}</span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold">{formatUserName(user)}</span>
              <span className="block truncate text-xs text-muted">
                {user.username ? `@${user.username}` : user.chat_id} · {user.plan_type || "FREE"}
              </span>
            </span>
            <span className="shrink-0 text-right text-[11px] text-muted">
              <span className="admin-user-status block" data-status={String(user.status).toLowerCase()}>{user.status}</span>
              <span className="block">{user.total_sessions} sessions</span>
            </span>
            <ChevronRight aria-hidden="true" className="shrink-0 text-muted" size={16} />
          </button>
        ))}
        {data && data.items.length === 0 && <p className="py-6 text-center text-sm text-muted">No users found.</p>}
      </div>

      <div className="admin-users-pager">
        <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <span className="text-xs text-muted">Page {page} of {totalPages}</span>
        <Button size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </Card>
  );
}
