// Hex values mirroring the @theme tokens in globals.css. Recharts renders SVG
// with computed attributes, so we pass concrete hex here rather than relying on
// CSS-variable resolution inside the chart library.
export const CHART = {
  accent: "#f5a623",
  accentDim: "#b37a1a",
  success: "#10b981",
  info: "#38bdf8",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#6b7280",
  grid: "#1f2937",
  border: "#374151",
  surface: "#111827",
  surface2: "#1f2937",
  textPrimary: "#f9fafb",
  textSecondary: "#d1d5db",
} as const;

/** Ordered categorical palette for bar charts / multi-series. */
export const CATEGORICAL: string[] = [
  "#f5a623", // accent
  "#38bdf8", // info
  "#10b981", // success
  "#a78bfa", // violet
  "#f472b6", // pink
  "#f59e0b", // warning
  "#34d399", // emerald
  "#60a5fa", // blue
  "#fb7185", // rose
  "#c084fc", // purple
];
