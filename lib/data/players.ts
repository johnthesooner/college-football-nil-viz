// Player / transfer data access. Pure functions over the static seed JSON.
import type {
  Player,
  SeedFile,
  Position,
  ClassYear,
  FlowGraph,
  FlowEdge,
  ConferenceFlowBalance,
} from "@/lib/types";
import playersJson from "@/data/seed/players.json";

const file = playersJson as unknown as SeedFile<Player>;

export function getPlayers(): Player[] {
  return file.data;
}

export function getPlayerById(id: string): Player | undefined {
  return file.data.find((p) => p.player_id === id);
}

export function getPlayersBySeason(season: number): Player[] {
  return file.data.filter((p) => p.season === season);
}

export function getPlayersMeta() {
  return file._meta;
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export interface PlayerFilters {
  search?: string;
  seasonMin?: number;
  seasonMax?: number;
  /** Match either the from- or to-conference. */
  conferences?: string[];
  positions?: Position[];
  classYears?: ClassYear[];
  /** Match either the from- or to-school name (used by timeline search). */
  school?: string;
}

/** Apply a set of filters to the players list. Undefined/empty filters are no-ops. */
export function filterPlayers(filters: PlayerFilters, players: Player[] = file.data): Player[] {
  const search = filters.search?.trim().toLowerCase();
  const school = filters.school?.trim().toLowerCase();
  const confSet = filters.conferences && filters.conferences.length > 0 ? new Set(filters.conferences) : null;
  const posSet = filters.positions && filters.positions.length > 0 ? new Set(filters.positions) : null;
  const classSet = filters.classYears && filters.classYears.length > 0 ? new Set(filters.classYears) : null;

  return players.filter((p) => {
    if (search && !p.player_name.toLowerCase().includes(search)) return false;
    if (filters.seasonMin !== undefined && p.season < filters.seasonMin) return false;
    if (filters.seasonMax !== undefined && p.season > filters.seasonMax) return false;
    if (confSet && !confSet.has(p.from_conference) && !confSet.has(p.to_conference)) return false;
    if (posSet && !posSet.has(p.position)) return false;
    if (classSet && !classSet.has(p.class_year)) return false;
    if (school && !p.from_school.toLowerCase().includes(school) && !p.to_school.toLowerCase().includes(school)) {
      return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

/** Sample transfer-row count per season (the dataset's per-year sample size). */
export function getTransferCountsByYear(): { season: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const p of file.data) counts.set(p.season, (counts.get(p.season) ?? 0) + 1);
  return [...counts.entries()].map(([season, count]) => ({ season, count })).sort((a, b) => a.season - b.season);
}

/** Count players by position across an optional player subset. */
export function getPositionCounts(players: Player[] = file.data): { position: Position; count: number }[] {
  const counts = new Map<Position, number>();
  for (const p of players) counts.set(p.position, (counts.get(p.position) ?? 0) + 1);
  return [...counts.entries()]
    .map(([position, count]) => ({ position, count }))
    .sort((a, b) => b.count - a.count);
}

/** The single most-transferred position over an optional subset, or null if empty. */
export function getMostTransferredPosition(players: Player[] = file.data): Position | null {
  const counts = getPositionCounts(players);
  return counts.length > 0 ? counts[0].position : null;
}

/** Conference receiving the most inbound transfers over an optional subset. */
export function getTopDestinationConference(players: Player[] = file.data): string | null {
  const counts = new Map<string, number>();
  for (const p of players) counts.set(p.to_conference, (counts.get(p.to_conference) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

/**
 * Build a directed flow graph for a season at conference or school level.
 * Edges aggregate player counts for each (from, to) pair. Self-moves (same
 * node on both ends) are dropped so the Sankey reads cleanly.
 */
export function getFlowGraph(
  season: number,
  level: "conference" | "school",
  topSchools = 15,
): FlowGraph {
  const seasonPlayers = getPlayersBySeason(season);
  const keyFrom = (p: Player) => (level === "conference" ? p.from_conference : p.from_school);
  const keyTo = (p: Player) => (level === "conference" ? p.to_conference : p.to_school);

  // For school level, restrict to the busiest schools by total involvement.
  let allowed: Set<string> | null = null;
  if (level === "school") {
    const involvement = new Map<string, number>();
    for (const p of seasonPlayers) {
      involvement.set(p.from_school, (involvement.get(p.from_school) ?? 0) + 1);
      involvement.set(p.to_school, (involvement.get(p.to_school) ?? 0) + 1);
    }
    const top = [...involvement.entries()].sort((a, b) => b[1] - a[1]).slice(0, topSchools).map(([s]) => s);
    allowed = new Set(top);
  }

  const edgeMap = new Map<string, FlowEdge>();
  const nodeSet = new Set<string>();
  for (const p of seasonPlayers) {
    const from = keyFrom(p);
    const to = keyTo(p);
    if (from === to) continue;
    if (allowed && (!allowed.has(from) || !allowed.has(to))) continue;
    nodeSet.add(from);
    nodeSet.add(to);
    const k = `${from}→${to}`;
    const existing = edgeMap.get(k);
    if (existing) existing.count += 1;
    else edgeMap.set(k, { from, to, count: 1 });
  }

  return {
    season,
    level,
    nodes: [...nodeSet].sort((a, b) => a.localeCompare(b)),
    edges: [...edgeMap.values()].sort((a, b) => b.count - a.count),
  };
}

/**
 * Inbound vs outbound transfer counts per conference, optionally for one season
 * (omit for all-time). `net` is inbound − outbound.
 */
export function getConferenceFlowBalance(season?: number): ConferenceFlowBalance[] {
  const players = season === undefined ? file.data : getPlayersBySeason(season);
  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();
  for (const p of players) {
    inbound.set(p.to_conference, (inbound.get(p.to_conference) ?? 0) + 1);
    outbound.set(p.from_conference, (outbound.get(p.from_conference) ?? 0) + 1);
  }
  const confs = new Set<string>([...inbound.keys(), ...outbound.keys()]);
  return [...confs]
    .map((conference) => {
      const inb = inbound.get(conference) ?? 0;
      const out = outbound.get(conference) ?? 0;
      return { conference, inbound: inb, outbound: out, net: inb - out };
    })
    .sort((a, b) => b.net - a.net);
}
