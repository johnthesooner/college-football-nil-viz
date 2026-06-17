import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Pulsing placeholder block. Compose several to build loading states. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-surface-2", className)}
    />
  );
}

/** A labeled loading region for charts and tables (accessible). */
export function SkeletonBlock({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("space-y-3", className)}>
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
