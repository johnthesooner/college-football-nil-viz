import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  caption?: string;
  icon?: LucideIcon;
  /** Optional element under the value, e.g. a <ConfidenceBadge />. */
  badge?: ReactNode;
  className?: string;
}

/** Callout card for a single headline metric. */
export function StatCard({ label, value, caption, icon: Icon, badge, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-accent" aria-hidden />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-accent">{value}</span>
      </div>
      {badge && <div className="mt-2">{badge}</div>}
      {caption && <p className="mt-2 text-xs leading-relaxed text-muted">{caption}</p>}
    </div>
  );
}
