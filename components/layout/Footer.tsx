import Link from "next/link";
import { Database } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:px-6">
        <div className="flex items-center gap-2 text-text-secondary">
          <Database className="h-4 w-4 text-accent" aria-hidden />
          <span className="font-medium">Illustrative sample data</span>
        </div>
        <p className="max-w-3xl leading-relaxed">
          This project visualizes how NIL and the transfer portal reshaped college football player
          movement (2005–2024). All figures are illustrative sample data — player-level NIL values are
          not confirmed. See the{" "}
          <Link href="/methodology" className="text-accent underline-offset-2 hover:underline">
            Methodology
          </Link>{" "}
          page for confidence definitions and how to load real data.
        </p>
      </div>
    </footer>
  );
}
