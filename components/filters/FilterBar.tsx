"use client";

import type { ReactNode } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

interface FilterBarProps {
  children: ReactNode;
  /** Shown when any filter is active; clears all filters. */
  onReset?: () => void;
  /** Whether the reset affordance is enabled (i.e. some filter is active). */
  active?: boolean;
  /** Optional summary line, e.g. "Showing 42 of 268 transfers". */
  summary?: ReactNode;
}

/** Generic, reusable filter row container. */
export function FilterBar({ children, onReset, active = false, summary }: FilterBarProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <SlidersHorizontal className="h-4 w-4 text-accent" aria-hidden />
          Filters
        </div>
        <div className="flex items-center gap-3">
          {summary && <span className="text-xs text-muted">{summary}</span>}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              disabled={!active}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-text-secondary transition-colors enabled:hover:bg-surface-2 disabled:opacity-40"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Reset
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </div>
  );
}

/** Labeled wrapper for a single filter control. */
export function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </div>
  );
}
