"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface AutoSizerProps {
  height: number;
  /** Render the chart with concrete pixel dimensions. */
  children: (size: { width: number; height: number }) => ReactNode;
}

// Width used before the element has been measured (and as a floor if the
// environment reports a 0-width layout). The ResizeObserver corrects this to
// the real width as soon as one is available.
const FALLBACK_WIDTH = 800;

/**
 * Measures its own width via ResizeObserver and renders children with explicit
 * pixel dimensions. Used instead of Recharts' ResponsiveContainer, which logs
 * "width(-1)/height(-1)" warnings when it measures before layout settles.
 * Always renders the chart (falling back to FALLBACK_WIDTH) so a 0-width
 * measurement never blanks the chart.
 */
export function AutoSizer({ height, children }: AutoSizerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setMeasured(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    const raf = requestAnimationFrame(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, []);

  const width = measured > 0 ? measured : FALLBACK_WIDTH;

  return (
    <div ref={ref} style={{ width: "100%", height }}>
      {children({ width, height })}
    </div>
  );
}
