"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon } from "lucide-react";

/** Route-level error boundary (App Router convention). */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-4 py-20 sm:px-6">
      <div className="flex items-center gap-2 text-danger">
        <AlertOctagon className="h-6 w-6" aria-hidden />
        <h1 className="text-xl font-semibold">Something went wrong</h1>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">
        An unexpected error occurred while rendering this page. You can try again, or head back to the
        story page.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background hover:bg-accent-dim"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-2"
        >
          Back to start
        </Link>
      </div>
    </div>
  );
}
