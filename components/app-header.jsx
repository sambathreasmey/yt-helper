import { CirclePlay } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemePicker } from "@/components/theme-picker";

export function AppHeader() {
  return (
    <header className="mb-5 flex min-h-14 items-center gap-3">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-surface-strong text-foreground shadow-glass">
        <CirclePlay aria-hidden="true" size={23} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold tracking-tight">YouTube Helper</span>
        <span className="mt-0.5 block text-xs text-muted">Your videos, one tap away</span>
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <ThemePicker />
        <Badge><span className="size-1.5 rounded-full bg-muted" />Ready</Badge>
      </div>
    </header>
  );
}
