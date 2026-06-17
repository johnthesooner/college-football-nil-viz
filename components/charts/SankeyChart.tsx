"use client";

import { useMemo, useState } from "react";
import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyNodeMinimal,
  type SankeyLinkMinimal,
} from "d3-sankey";
import type { FlowGraph } from "@/lib/types";
import { AutoSizer } from "@/components/charts/AutoSizer";
import { CHART, CATEGORICAL } from "@/components/charts/palette";
import { formatNumber } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

// Bipartite node/link shapes. Each real node becomes two Sankey nodes — a
// left-column "source" and a right-column "target" — so bidirectional flows
// (e.g. SEC→Big Ten and Big Ten→SEC) never form a cycle, which d3-sankey
// forbids.
interface SNodeExtra {
  id: string;
  name: string;
  side: "source" | "target";
}
interface SLinkExtra {
  from: string;
  to: string;
  count: number;
}
type SNode = SankeyNodeMinimal<SNodeExtra, SLinkExtra> & SNodeExtra;
type SLink = SankeyLinkMinimal<SNodeExtra, SLinkExtra> & SLinkExtra;

interface HoverState {
  x: number;
  y: number;
  from: string;
  to: string;
  count: number;
}

const LABEL_INSET = 96; // horizontal room reserved for node labels
const NODE_WIDTH = 13;
const NODE_PADDING = 12;

function colorFor(name: string, keys: string[]): string {
  const idx = keys.indexOf(name);
  return CATEGORICAL[idx % CATEGORICAL.length];
}

export function SankeyChart({ graph, height = 460 }: { graph: FlowGraph; height?: number }) {
  if (graph.edges.length === 0) {
    return (
      <EmptyState
        message="No flows to show for this season."
        hint="Try a different season or switch between conference and school view."
      />
    );
  }

  return (
    <AutoSizer height={height}>
      {({ width, height: h }) => <SankeyInner graph={graph} width={width} height={h} />}
    </AutoSizer>
  );
}

function SankeyInner({ graph, width, height }: { graph: FlowGraph; width: number; height: number }) {
  const [hover, setHover] = useState<HoverState | null>(null);

  // Distinct source/target labels drive the bipartite node set and colors.
  const sourceKeys = useMemo(
    () => [...new Set(graph.edges.map((e) => e.from))].sort((a, b) => a.localeCompare(b)),
    [graph],
  );
  const targetKeys = useMemo(
    () => [...new Set(graph.edges.map((e) => e.to))].sort((a, b) => a.localeCompare(b)),
    [graph],
  );

  const layout = useMemo(() => {
    const nodeDefs: SNodeExtra[] = [
      ...sourceKeys.map((name) => ({ id: `src:${name}`, name, side: "source" as const })),
      ...targetKeys.map((name) => ({ id: `tgt:${name}`, name, side: "target" as const })),
    ];
    const indexById = new Map(nodeDefs.map((n, i) => [n.id, i]));
    const linkDefs = graph.edges.map((e) => ({
      source: indexById.get(`src:${e.from}`) as number,
      target: indexById.get(`tgt:${e.to}`) as number,
      value: e.count,
      from: e.from,
      to: e.to,
      count: e.count,
    }));

    const generator = sankey<SNodeExtra, SLinkExtra>()
      .nodeWidth(NODE_WIDTH)
      .nodePadding(NODE_PADDING)
      .extent([
        [LABEL_INSET, 6],
        [Math.max(LABEL_INSET + 40, width - LABEL_INSET), height - 6],
      ]);

    // Pass fresh copies — the generator mutates the arrays it receives.
    return generator({
      nodes: nodeDefs.map((d) => ({ ...d })),
      links: linkDefs.map((d) => ({ ...d })),
    });
  }, [graph, sourceKeys, targetKeys, width, height]);

  const nodes = layout.nodes as SNode[];
  const links = layout.links as SLink[];
  const linkPath = sankeyLinkHorizontal<SNodeExtra, SLinkExtra>();

  return (
    <div className="relative">
      <svg width={width} height={height} role="img" aria-label="Player flow Sankey diagram">
        {/* Column headers */}
        <text x={LABEL_INSET} y={4} fill={CHART.muted} fontSize={11} textAnchor="middle" dominantBaseline="hanging">
          From
        </text>
        <text
          x={Math.max(LABEL_INSET + 40, width - LABEL_INSET)}
          y={4}
          fill={CHART.muted}
          fontSize={11}
          textAnchor="middle"
          dominantBaseline="hanging"
        >
          To
        </text>

        {/* Links */}
        <g fill="none">
          {links.map((link, i) => {
            const active = hover?.from === link.from && hover?.to === link.to;
            const color = colorFor(link.from, sourceKeys);
            return (
              <path
                key={i}
                d={linkPath(link) ?? undefined}
                stroke={color}
                strokeOpacity={hover ? (active ? 0.85 : 0.12) : 0.4}
                strokeWidth={Math.max(1, link.width ?? 1)}
                onMouseMove={(ev) => {
                  const rect = (ev.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({
                    x: ev.clientX - rect.left,
                    y: ev.clientY - rect.top,
                    from: link.from,
                    to: link.to,
                    count: link.count,
                  });
                }}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((node, i) => {
            const x0 = node.x0 ?? 0;
            const y0 = node.y0 ?? 0;
            const x1 = node.x1 ?? 0;
            const y1 = node.y1 ?? 0;
            const isSource = node.side === "source";
            const color = colorFor(node.name, isSource ? sourceKeys : targetKeys);
            return (
              <g key={i}>
                <rect x={x0} y={y0} width={x1 - x0} height={Math.max(1, y1 - y0)} fill={color} rx={2} />
                <text
                  x={isSource ? x0 - 6 : x1 + 6}
                  y={(y0 + y1) / 2}
                  textAnchor={isSource ? "end" : "start"}
                  dominantBaseline="middle"
                  fontSize={12}
                  fill={CHART.textSecondary}
                >
                  {node.name}
                  <tspan fill={CHART.muted}> · {node.value ?? 0}</tspan>
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(hover.x + 12, width - 180), top: Math.max(0, hover.y - 12) }}
        >
          <span className="font-bold text-accent">{formatNumber(hover.count)}</span>{" "}
          <span className="text-text-secondary">
            player{hover.count === 1 ? "" : "s"} moved from{" "}
          </span>
          <span className="font-medium text-text-primary">{hover.from}</span>
          <span className="text-text-secondary"> to </span>
          <span className="font-medium text-text-primary">{hover.to}</span>
        </div>
      )}
    </div>
  );
}
