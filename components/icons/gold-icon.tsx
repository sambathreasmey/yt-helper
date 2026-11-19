import type { SVGProps } from "react";

export interface GoldIconProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  size?: number | string;
  strokeWidth?: number | string;
}

/**
 * Stacked gold bars. Same API as the lucide-react icons (size, strokeWidth, className, aria-*),
 * so it can replace one directly. Colour comes from `currentColor`.
 */
export function GoldIcon({ size = 24, strokeWidth = 2, ...props }: GoldIconProps) {
  return (
    <svg
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M7.5 9.5 9.2 3h5.6l1.7 6.5z" />
      <path d="M1.5 21l1.7-8.5h5.6L10.5 21z" />
      <path d="M13.5 21l1.7-8.5h5.6l1.7 8.5z" />
    </svg>
  );
}
