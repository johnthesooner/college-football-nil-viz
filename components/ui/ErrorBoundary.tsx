"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback; receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Short label for the section being guarded, used in the default fallback. */
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Section-level error boundary. Wrap charts/tables so a render failure shows a
 * recoverable message instead of blanking the whole page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface in the console for debugging; in production this is where a
    // telemetry hook would go.
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback, label } = this.props;

    if (error) {
      if (fallback) return fallback(error, this.reset);
      return (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-5"
        >
          <div className="flex items-center gap-2 text-danger">
            <AlertOctagon className="h-5 w-5" aria-hidden />
            <span className="text-sm font-semibold">
              {label ? `Couldn't render ${label}.` : "Something went wrong."}
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            An unexpected error occurred while rendering this section.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-border"
          >
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}
