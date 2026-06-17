"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GitBranch } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { SankeyChart } from "@/components/charts/SankeyChart";
import { Select } from "@/components/filters/Select";
import { getFlowGraph } from "@/lib/data/players";
import { getSeasonYears, getLatestSeason } from "@/lib/data/seasons";
import { cn } from "@/lib/utils";

type Level = "conference" | "school";

const SEASON_YEARS = getSeasonYears().slice().sort((a, b) => b - a); // latest first
const DEFAULT_SEASON = getLatestSeason();

export default function FlowPage() {
  const [season, setSeason] = useState(DEFAULT_SEASON);
  const [level, setLevel] = useState<Level>("conference");

  const graph = useMemo(() => getFlowGraph(season, level, 15), [season, level]);
  const totalMoves = useMemo(() => graph.edges.reduce((s, e) => s + e.count, 0), [graph]);

  const seasonOptions = SEASON_YEARS.map((y) => ({ value: String(y), label: String(y) }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Player Flow Map"
        subtitle="Where players moved, by season. Left column is the origin (conference or school); right column is the destination. Bar height reflects transfer volume; band thickness reflects the number of players on that path."
      />

      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Season</span>
            <Select
              ariaLabel="Season"
              value={String(season)}
              options={seasonOptions}
              onChange={(v) => setSeason(Number(v))}
              className="w-32"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">View</span>
            <div className="inline-flex rounded-md border border-border bg-surface-2 p-0.5">
              {(["conference", "school"] as Level[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={level === l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    level === l ? "bg-accent text-background" : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {l === "school" ? "School-to-school" : "Conference-to-conference"}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto text-sm text-muted">
            <span className="font-semibold text-text-secondary">{totalMoves}</span> sample transfers
            {level === "school" && " · top 15 schools"}
          </div>
        </div>

        {/* Sankey */}
        <Card
          title={`${season} — ${level === "conference" ? "Conference-to-conference" : "School-to-school"} flow`}
          subtitle="Hover any band to see how many players moved along that path."
        >
          <ChartFrame label="the flow diagram" height={480}>
            <SankeyChart graph={graph} />
          </ChartFrame>
        </Card>

        {/* Legend */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <LegendItem
            title="Bar height = volume"
            body="A taller bar means more players left from (left) or arrived at (right) that conference or school."
          />
          <LegendItem
            title="Band thickness = players"
            body="A thicker band means more players moved along that specific origin → destination path."
          />
          <LegendItem
            title="Color = origin"
            body="Bands are colored by where the players came from, so you can trace a source across the diagram."
          />
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Each conference/school appears on both sides (as an origin and a destination) so two-way
          movement renders cleanly. Figures are illustrative sample data — see the{" "}
          <Link href="/methodology" className="text-accent underline-offset-2 hover:underline">
            Methodology
          </Link>{" "}
          page.
        </p>
      </div>
    </div>
  );
}

function LegendItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
        <GitBranch className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">{body}</p>
      </div>
    </div>
  );
}
