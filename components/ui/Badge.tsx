import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "accent" | "success" | "info" | "warning" | "danger";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "text-text-secondary border-border bg-surface-2",
  accent: "text-accent border-accent/40 bg-accent/10",
  success: "text-success border-success/40 bg-success/10",
  info: "text-info border-info/40 bg-info/10",
  warning: "text-warning border-warning/40 bg-warning/10",
  danger: "text-danger border-danger/40 bg-danger/10",
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/** Generic pill badge for tags, positions, conferences, etc. */
export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
