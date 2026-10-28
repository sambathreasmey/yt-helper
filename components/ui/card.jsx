import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <section className={cn("glass rounded-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("px-4 pt-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn("text-sm font-semibold tracking-wide text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-xs leading-relaxed text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-4", className)} {...props} />;
}
