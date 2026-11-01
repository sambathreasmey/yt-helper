import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-12 min-w-0 flex-1 rounded-2xl border border-border bg-surface-strong px-4 text-sm text-foreground shadow-inner shadow-black/[0.03]",
        "placeholder:text-muted/80 transition-colors focus:border-muted focus:bg-surface-strong focus:outline-none focus:ring-2 focus:ring-muted/20",
        className,
      )}
      {...props}
    />
  );
}
