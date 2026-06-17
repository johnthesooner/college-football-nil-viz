"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Minimal hover/focus tooltip. CSS-positioned above the trigger — used for
 * inline explanations (chart-independent; Recharts supplies its own tooltips).
 */
export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-40 mb-2 w-max max-w-xs -translate-x-1/2 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs leading-snug text-text-secondary shadow-lg"
        >
          {content}
        </span>
      )}
    </span>
  );
}
