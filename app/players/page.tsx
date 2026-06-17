"use client";

import { useMemo, useState, Fragment } from "react";
import { ChevronRight } from "lucide-react";
import type { Player, NILDeal, Position, ClassYear, ConfidenceLevel } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { FilterBar, FilterGroup } from "@/components/filters/FilterBar";
import { SearchInput } from "@/components/filters/SearchInput";
import { Select } from "@/components/filters/Select";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { SourceLink } from "@/components/ui/SourceLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPlayers, filterPlayers } from "@/lib/data/players";
import { getDealByPlayerId } from "@/lib/data/nil";
import { getConferences } from "@/lib/data/schools";
import { getSeasonYears } from "@/lib/data/seasons";
import { POSITIONS, CLASS_YEAR_LABELS, CONFIDENCE_LEVELS } from "@/lib/constants";
import { cn, formatNilAmount } from "@/lib/utils";

const PAGE_SIZE = 25;
const ALL = "all";

const SEASON_OPTS = [{ value: ALL, label: "All seasons" }, ...getSeasonYears().slice().sort((a, b) => b - a).map((y) => ({ value: String(y), label: String(y) }))];
const POSITION_OPTS = [{ value: ALL, label: "All positions" }, ...POSITIONS.map((p) => ({ value: p, label: p }))];
const CONFERENCE_OPTS = [{ value: ALL, label: "All conferences" }, ...getConferences().map((c) => ({ value: c, label: c }))];
const CONFIDENCE_OPTS = [
  { value: ALL, label: "All NIL confidence" },
  ...CONFIDENCE_LEVELS.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })),
];

export default function PlayersPage() {
  const dealMap = useMemo(() => getDealByPlayerId(), []);

  const [search, setSearch] = useState("");
  const [season, setSeason] = useState(ALL);
  const [position, setPosition] = useState(ALL);
  const [conference, setConference] = useState(ALL);
  const [confidence, setConfidence] = useState(ALL);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = filterPlayers({
      search,
      seasonMin: season === ALL ? undefined : Number(season),
      seasonMax: season === ALL ? undefined : Number(season),
      positions: position === ALL ? [] : [position as Position],
      conferences: conference === ALL ? [] : [conference],
    });
    if (confidence !== ALL) {
      rows = rows.filter((p) => dealMap.get(p.player_id)?.confidence_level === (confidence as ConfidenceLevel));
    }
    return rows;
  }, [search, season, position, conference, confidence, dealMap]);

  // Reset to first page whenever the filtered set changes size/content.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const isActive = search.trim() !== "" || season !== ALL || position !== ALL || conference !== ALL || confidence !== ALL;

  function resetAll() {
    setSearch("");
    setSeason(ALL);
    setPosition(ALL);
    setConference(ALL);
    setConfidence(ALL);
    setPage(0);
    setExpandedId(null);
  }

  function onFilterChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(0);
      setExpandedId(null);
    };
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Player Explorer"
        subtitle="Search and filter individual transfers. Click any row to see the full record and data notes. NIL amounts are illustrative sample data and carry a confidence badge."
      />

      <div className="space-y-6">
        <FilterBar
          onReset={resetAll}
          active={isActive}
          summary={
            <>
              <span className="font-semibold text-text-secondary">{filtered.length}</span> of {getPlayers().length} players
            </>
          }
        >
          <FilterGroup label="Search name">
            <SearchInput value={search} onChange={onFilterChange(setSearch)} placeholder="Player name…" />
          </FilterGroup>
          <FilterGroup label="Season">
            <Select ariaLabel="Season" value={season} options={SEASON_OPTS} onChange={onFilterChange(setSeason)} />
          </FilterGroup>
          <FilterGroup label="Position">
            <Select ariaLabel="Position" value={position} options={POSITION_OPTS} onChange={onFilterChange(setPosition)} />
          </FilterGroup>
          <FilterGroup label="Conference">
            <Select ariaLabel="Conference" value={conference} options={CONFERENCE_OPTS} onChange={onFilterChange(setConference)} />
          </FilterGroup>
          <FilterGroup label="NIL confidence">
            <Select ariaLabel="NIL confidence" value={confidence} options={CONFIDENCE_OPTS} onChange={onFilterChange(setConfidence)} />
          </FilterGroup>
        </FilterBar>

        {filtered.length === 0 ? (
          <EmptyState message="No players match your filters" hint="Try clearing or widening your filters." />
        ) : (
          <div className="rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                    <th className="py-3 pl-4 pr-3 font-medium" />
                    <th className="py-3 pr-3 font-medium">Player</th>
                    <th className="py-3 pr-3 font-medium">Pos</th>
                    <th className="py-3 pr-3 font-medium">From</th>
                    <th className="py-3 pr-3 font-medium">To</th>
                    <th className="py-3 pr-3 font-medium">Season</th>
                    <th className="py-3 pr-3 font-medium">NIL amount</th>
                    <th className="py-3 pr-3 font-medium">Confidence</th>
                    <th className="py-3 pr-4 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((p) => {
                    const deal = dealMap.get(p.player_id) ?? null;
                    const expanded = expandedId === p.player_id;
                    return (
                      <Fragment key={p.player_id}>
                        <tr
                          onClick={() => setExpandedId(expanded ? null : p.player_id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setExpandedId(expanded ? null : p.player_id);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-expanded={expanded}
                          aria-label={`${p.player_name} — ${expanded ? "collapse" : "expand"} full transfer record`}
                          className="cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                        >
                          <td className="py-2.5 pl-4 pr-3 text-muted">
                            <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} aria-hidden />
                          </td>
                          <td className="py-2.5 pr-3 font-medium text-text-primary">{p.player_name}</td>
                          <td className="py-2.5 pr-3">
                            <Badge variant="neutral">{p.position}</Badge>
                          </td>
                          <td className="py-2.5 pr-3 text-text-secondary">{p.from_school}</td>
                          <td className="py-2.5 pr-3 text-text-secondary">{p.to_school}</td>
                          <td className="py-2.5 pr-3 text-text-secondary">{p.season}</td>
                          <td className="py-2.5 pr-3 font-semibold text-accent">
                            {deal ? formatNilAmount(deal.reported_amount) : <span className="text-muted">—</span>}
                          </td>
                          <td className="py-2.5 pr-3">
                            {deal ? <ConfidenceBadge level={deal.confidence_level} /> : <span className="text-xs text-muted">No deal</span>}
                          </td>
                          <td className="py-2.5 pr-4">
                            {deal ? <SourceLink url={deal.source_url} name={deal.source_name} /> : <span className="text-xs text-muted">—</span>}
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="border-b border-border/60 bg-background/40">
                            <td colSpan={9} className="px-4 py-4">
                              <PlayerDetail player={p} deal={deal} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
              <span className="text-muted">
                Page {safePage + 1} of {pageCount} · {filtered.length} players
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(0, safePage - 1))}
                  disabled={safePage === 0}
                  className="rounded-md border border-border px-3 py-1.5 font-medium text-text-secondary enabled:hover:bg-surface-2 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
                  disabled={safePage >= pageCount - 1}
                  className="rounded-md border border-border px-3 py-1.5 font-medium text-text-secondary enabled:hover:bg-surface-2 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerDetail({ player, deal }: { player: Player; deal: NILDeal | null }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Player">{player.player_name}</Field>
      <Field label="Position">{player.position}</Field>
      <Field label="Class year">{CLASS_YEAR_LABELS[player.class_year as ClassYear]} ({player.class_year})</Field>
      <Field label="Season">{player.season}</Field>
      <Field label="From">{player.from_school} · {player.from_conference}</Field>
      <Field label="To">{player.to_school} · {player.to_conference}</Field>
      <Field label="Transfer date">{player.transfer_date ?? "Not recorded"}</Field>
      <Field label="Transfer source">
        <SourceLink url={player.source_url} name={player.source_name} />
      </Field>
      <Field label="NIL amount">
        {deal ? (
          <span className="inline-flex items-center gap-2">
            <span className="font-semibold text-accent">{formatNilAmount(deal.reported_amount)}</span>
            <ConfidenceBadge level={deal.confidence_level} />
          </span>
        ) : (
          <span className="text-muted">No reported deal</span>
        )}
      </Field>
      <div className="sm:col-span-2 lg:col-span-3">
        <Field label="Data note">
          {deal ? deal.notes : "No NIL deal is on record for this player in the sample dataset."}
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1 text-sm text-text-secondary">{children}</div>
    </div>
  );
}
