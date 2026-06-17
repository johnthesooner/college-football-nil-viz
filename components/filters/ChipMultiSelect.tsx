"use client";

import { cn } from "@/lib/utils";

interface ChipMultiSelectProps<T extends string> {
  options: readonly T[];
  selected: T[];
  onChange: (next: T[]) => void;
  /** Optional display formatter for an option value. */
  format?: (value: T) => string;
}

/**
 * Multi-select rendered as toggleable chips. Selecting none means "all" at the
 * call site — this component only manages the explicit selection set.
 */
export function ChipMultiSelect<T extends string>({
  options,
  selected,
  onChange,
  format,
}: ChipMultiSelectProps<T>) {
  const selectedSet = new Set(selected);

  function toggle(value: T) {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(options.filter((o) => next.has(o)));
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isActive = selectedSet.has(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            onClick={() => toggle(option)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-accent/50 bg-accent/15 text-accent"
                : "border-border bg-surface-2 text-text-secondary hover:border-muted hover:text-text-primary",
            )}
          >
            {format ? format(option) : option}
          </button>
        );
      })}
    </div>
  );
}
