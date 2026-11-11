import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Shimmer placeholder shown while data loads. Decorative, so hidden from assistive tech. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("skeleton", className)} {...props} />;
}
