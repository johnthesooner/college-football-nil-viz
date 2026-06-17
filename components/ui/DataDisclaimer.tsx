import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataDisclaimerProps {
  /** Override the default NIL warning copy. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Page-level warning banner for NIL data. Required at the top of any page that
 * surfaces dollar figures, reinforcing that values are illustrative sample data.
 */
export function DataDisclaimer({ children, className }: DataDisclaimerProps) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
      <div className="text-sm leading-relaxed text-text-secondary">
        {children ?? (
          <>
            <span className="font-semibold text-warning">Illustrative sample data.</span>{" "}
            Player-level NIL dollar figures shown here are <strong>not confirmed</strong> and must not
            be treated as real reported amounts. Each value carries a confidence badge. See the{" "}
            <Link href="/methodology" className="font-medium text-accent underline-offset-2 hover:underline">
              Methodology
            </Link>{" "}
            page for definitions and sourcing.
          </>
        )}
      </div>
    </div>
  );
}
