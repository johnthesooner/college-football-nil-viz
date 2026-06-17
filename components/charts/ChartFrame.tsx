import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SkeletonBlock } from "@/components/ui/Skeleton";

interface ChartFrameProps {
  children: ReactNode;
  /** Short label used in the error fallback, e.g. "the timeline chart". */
  label?: string;
  height?: number;
}

/**
 * Wraps a chart in an error boundary + Suspense with a skeleton fallback, so
 * every chart in the app gets consistent loading and error handling.
 */
export function ChartFrame({ children, label = "this chart", height = 320 }: ChartFrameProps) {
  return (
    <ErrorBoundary label={label}>
      <Suspense fallback={<SkeletonBlock className="w-full" />}>
        <div style={{ minHeight: height }}>{children}</div>
      </Suspense>
    </ErrorBoundary>
  );
}
