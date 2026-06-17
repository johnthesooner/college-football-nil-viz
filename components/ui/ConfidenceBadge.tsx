import { ShieldCheck, Newspaper, Sigma, CircleHelp } from "lucide-react";
import type { ConfidenceLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ConfidenceMeta {
  label: string;
  /** Tailwind classes for text, tinted background, and border. */
  classes: string;
  Icon: typeof ShieldCheck;
  description: string;
}

// Central definition of how each confidence tier looks and reads. Importing
// CONFIDENCE_META elsewhere (e.g. the methodology legend) keeps it consistent.
export const CONFIDENCE_META: Record<ConfidenceLevel, ConfidenceMeta> = {
  confirmed: {
    label: "Confirmed",
    classes: "text-success border-success/40 bg-success/10",
    Icon: ShieldCheck,
    description: "Verified against a primary source with a documented dollar figure.",
  },
  reported: {
    label: "Reported",
    classes: "text-info border-info/40 bg-info/10",
    Icon: Newspaper,
    description: "Stated by media reporting but not independently confirmed.",
  },
  estimated: {
    label: "Estimated",
    classes: "text-warning border-warning/40 bg-warning/10",
    Icon: Sigma,
    description: "Modeled or inferred from context — not a reported figure.",
  },
  unknown: {
    label: "Unknown",
    classes: "text-muted border-border bg-surface-2",
    Icon: CircleHelp,
    description: "No reliable amount is available; shown without a value.",
  },
};

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  /** Hide the text label, leaving just the icon (for dense tables). */
  iconOnly?: boolean;
  className?: string;
}

/**
 * The honesty primitive. Every NIL dollar figure in the app renders one of
 * these next to it so a value's confidence travels with the value itself.
 */
export function ConfidenceBadge({ level, iconOnly = false, className }: ConfidenceBadgeProps) {
  const meta = CONFIDENCE_META[level];
  const { Icon } = meta;
  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.classes,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {!iconOnly && <span>{meta.label}</span>}
      <span className="sr-only">confidence: {meta.label}</span>
    </span>
  );
}
