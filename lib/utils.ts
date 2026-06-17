// Pure utility helpers. No React, no side effects — unit-tested in
// lib/utils.test.ts.

/**
 * Join class names, dropping falsy values. A tiny `clsx` stand-in so we don't
 * pull a dependency for conditional Tailwind classes.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Format an integer with thousands separators, e.g. 11000 -> "11,000". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Compact currency for large dollar figures, e.g. 917000000 -> "$917M",
 * 1280000000 -> "$1.28B". Falls back to plain dollars under 1,000.
 */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}$${trimZeros(abs / 1_000_000_000)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${trimZeros(abs / 1_000_000)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${trimZeros(abs / 1_000)}K`;
  }
  return `${sign}$${Math.round(abs)}`;
}

/** Full currency formatting, e.g. 250000 -> "$250,000". */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Render a NIL dollar value for display. Returns a guaranteed-non-null string,
 * surfacing "Not disclosed" when the amount is unknown rather than "$0" — we
 * never imply a value we don't have.
 */
export function formatNilAmount(
  amount: number | null,
  compact = false,
): string {
  if (amount === null || amount === undefined) return "Not disclosed";
  return compact ? formatCompactCurrency(amount) : formatCurrency(amount);
}

/** Round to at most two decimals and drop a trailing ".0" / ".00". */
function trimZeros(n: number): string {
  return parseFloat(n.toFixed(2)).toString();
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Pearson correlation coefficient for two equal-length numeric series. */
export function pearson(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length === 0) {
    throw new Error("pearson: series must be equal, non-zero length");
  }
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

/** Title-case a slug or lowercased phrase for display. */
export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
