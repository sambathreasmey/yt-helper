"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { BottomSheet } from "@/components/bottom-sheet";

/** One row in the menu. Add more of these to give a card more options. */
export interface MenuAction {
  id: string;
  icon: ReactNode;
  label: string;
  description?: string;
  onSelect: () => void;
}

/** Bottom sheet listing a card's actions as tappable rows. */
export function ActionMenuSheet({
  open,
  onClose,
  title,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  actions: MenuAction[];
}) {
  return (
    <BottomSheet onClose={onClose} open={open} title={title}>
      <ul className="grid gap-2">
        {actions.map((action) => (
          <li key={action.id}>
            <button
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-strong px-3.5 py-3 text-left text-foreground"
              onClick={action.onSelect}
              type="button"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">{action.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{action.label}</span>
                {action.description && <span className="mt-0.5 block text-xs text-muted">{action.description}</span>}
              </span>
              <ChevronRight aria-hidden="true" className="shrink-0 text-muted" size={18} />
            </button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
