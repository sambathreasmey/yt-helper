"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const selectClass =
  "h-11 rounded-xl border border-border bg-surface-strong px-3 text-sm text-foreground";

export function Section({ title, children, className }) {
  return (
    <Card className={cn("space-y-2 p-4", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.09em] text-muted">{title}</p>
      {children}
    </Card>
  );
}

export function Field({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-xs">
      <span className="text-muted">{label}</span>
      <span className="truncate text-right">{value ?? "-"}</span>
    </div>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="text-xs text-red-400">{children}</p>;
}

export function Notice({ children }) {
  if (!children) return null;
  return <p className="text-xs text-muted">{children}</p>;
}

export function formatUserName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || user.chat_id;
}
