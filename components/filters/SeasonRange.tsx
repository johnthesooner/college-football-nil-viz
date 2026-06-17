"use client";

import { Select } from "@/components/filters/Select";

interface SeasonRangeProps {
  min: number;
  max: number;
  /** Available season bounds [earliest, latest]. */
  bounds: [number, number];
  onChange: (min: number, max: number) => void;
}

/** From/to season selectors that keep min <= max. */
export function SeasonRange({ min, max, bounds, onChange }: SeasonRangeProps) {
  const [lo, hi] = bounds;
  const years: number[] = [];
  for (let y = lo; y <= hi; y++) years.push(y);
  const options = years.map((y) => ({ value: String(y), label: String(y) }));

  return (
    <div className="flex items-center gap-2">
      <Select
        ariaLabel="Season from"
        value={String(min)}
        options={options}
        onChange={(v) => {
          const next = Number(v);
          onChange(next, Math.max(next, max));
        }}
      />
      <span className="text-xs text-muted">to</span>
      <Select
        ariaLabel="Season to"
        value={String(max)}
        options={options}
        onChange={(v) => {
          const next = Number(v);
          onChange(Math.min(min, next), next);
        }}
      />
    </div>
  );
}
