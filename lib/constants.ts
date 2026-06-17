// Canonical option lists for filters and displays. Kept in sync with the union
// types in lib/types.ts.
import type { Position, ClassYear, ConfidenceLevel } from "@/lib/types";

export const POSITIONS: readonly Position[] = [
  "QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P", "ATH",
];

export const CLASS_YEARS: readonly ClassYear[] = ["FR", "SO", "JR", "SR", "GR"];

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = [
  "confirmed", "reported", "estimated", "unknown",
];

export const CLASS_YEAR_LABELS: Record<ClassYear, string> = {
  FR: "Freshman",
  SO: "Sophomore",
  JR: "Junior",
  SR: "Senior",
  GR: "Graduate",
};
