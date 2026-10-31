import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background hover:bg-accent hover:text-background",
  secondary: "border border-border bg-surface text-foreground hover:bg-surface-strong",
  outline: "border border-border bg-transparent text-foreground hover:bg-surface",
  ghost: "bg-transparent text-muted hover:bg-surface hover:text-foreground",
};

const sizes: Record<ButtonSize, string> = {
  default: "min-h-11 px-4 py-2.5 text-sm",
  sm: "min-h-9 px-3 py-2 text-xs",
  icon: "size-11 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "secondary",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
