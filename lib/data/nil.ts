// NIL-deal data access. Pure functions over the static seed JSON.
//
// Honesty invariants enforced here:
//  - bucket aggregates carry the WORST (least certain) confidence present, so a
//    bucket is never shown as more confident than its least-certain member;
//  - unknown amounts (reported_amount === null) are excluded from dollar sums
//    rather than treated as $0.
import type {
  NILDeal,
  SeedFile,
  ConfidenceLevel,
  NILDealWithPlayer,
  NILAggregate,
} from "@/lib/types";
import nilJson from "@/data/seed/nil_deals.json";
import { getPlayerById } from "@/lib/data/players";
import { getConferenceBySchool } from "@/lib/data/schools";

const file = nilJson as unknown as SeedFile<NILDeal>;

/** Certainty rank — higher is more certain. */
const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  confirmed: 3,
  reported: 2,
  estimated: 1,
  unknown: 0,
};

/** The least-certain level among a set of deals (defaults to "unknown"). */
function worstConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  let worst: ConfidenceLevel = "confirmed";
  let worstRank = CONFIDENCE_RANK.confirmed;
  for (const l of levels) {
    if (CONFIDENCE_RANK[l] < worstRank) {
      worst = l;
      worstRank = CONFIDENCE_RANK[l];
    }
  }
  return levels.length === 0 ? "unknown" : worst;
}

export function getNILDeals(): NILDeal[] {
  return file.data;
}

export function getNILMeta() {
  return file._meta;
}

/** Deals joined to their player record (player may be null if missing). */
export function getNILDealsWithPlayers(): NILDealWithPlayer[] {
  return file.data.map((d) => ({ ...d, player: getPlayerById(d.player_id) ?? null }));
}

/**
 * Top deals by reported amount. Deals with unknown amounts are excluded (we
 * cannot rank a value we do not have). Sorted descending.
 */
export function getTopDeals(limit = 10): NILDealWithPlayer[] {
  return getNILDealsWithPlayers()
    .filter((d) => d.reported_amount !== null)
    .sort((a, b) => (b.reported_amount ?? 0) - (a.reported_amount ?? 0))
    .slice(0, limit);
}

interface Bucket {
  total: number;
  count: number;
  levels: ConfidenceLevel[];
}

function aggregate(
  keyFor: (deal: NILDealWithPlayer) => string | null,
): NILAggregate[] {
  const buckets = new Map<string, Bucket>();
  for (const d of getNILDealsWithPlayers()) {
    const key = keyFor(d);
    if (key === null) continue;
    const b = buckets.get(key) ?? { total: 0, count: 0, levels: [] };
    // Only sum disclosed amounts; never treat unknown as zero-dollar.
    if (d.reported_amount !== null) b.total += d.reported_amount;
    b.count += 1;
    b.levels.push(d.confidence_level);
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .map(([key, b]) => ({
      key,
      total_reported: b.total,
      deal_count: b.count,
      confidence: worstConfidence(b.levels),
    }))
    .sort((a, b) => b.total_reported - a.total_reported);
}

/** Reported NIL totals by player position (requires the joined player). */
export function getNILByPosition(): NILAggregate[] {
  return aggregate((d) => d.player?.position ?? null);
}

/** Reported NIL totals by school, top N by total. */
export function getNILBySchool(limit = 10): NILAggregate[] {
  return aggregate((d) => d.school).slice(0, limit);
}

/** Reported NIL totals by the conference of the deal's school. */
export function getNILByConference(): NILAggregate[] {
  const confBySchool = getConferenceBySchool();
  return aggregate((d) => confBySchool.get(d.school) ?? null);
}

/**
 * Map of player_id -> their NIL deal. In the sample each player has at most one
 * deal; if real data had several, this keeps the first encountered.
 */
export function getDealByPlayerId(): Map<string, NILDeal> {
  const m = new Map<string, NILDeal>();
  for (const d of file.data) if (!m.has(d.player_id)) m.set(d.player_id, d);
  return m;
}

/** Count of deals at each confidence level (for the methodology / mix display). */
export function getConfidenceMix(): { level: ConfidenceLevel; count: number }[] {
  const counts = new Map<ConfidenceLevel, number>();
  for (const d of file.data) counts.set(d.confidence_level, (counts.get(d.confidence_level) ?? 0) + 1);
  const order: ConfidenceLevel[] = ["confirmed", "reported", "estimated", "unknown"];
  return order.map((level) => ({ level, count: counts.get(level) ?? 0 }));
}
