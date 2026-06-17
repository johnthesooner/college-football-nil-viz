// Core domain types for the NIL & Transfer Portal app.
// These are the single source of truth — seed JSON, the data layer, and the
// UI all conform to the interfaces below.

export type ConfidenceLevel = "confirmed" | "reported" | "estimated" | "unknown";
export type AmountType = "exact" | "range" | "estimated" | "unknown";
export type Position =
  | "QB"
  | "RB"
  | "WR"
  | "TE"
  | "OL"
  | "DL"
  | "LB"
  | "CB"
  | "S"
  | "K"
  | "P"
  | "ATH";
export type ClassYear = "FR" | "SO" | "JR" | "SR" | "GR";

export interface Player {
  player_id: string;
  player_name: string;
  position: Position;
  class_year: ClassYear;
  season: number;
  from_school: string;
  to_school: string;
  from_conference: string;
  to_conference: string;
  transfer_date: string | null; // ISO date or null
  source_url: string | null;
  source_name: string | null;
}

export interface NILDeal {
  deal_id: string;
  player_id: string;
  season: number;
  school: string;
  reported_amount: number | null; // USD; null if unknown
  amount_type: AmountType;
  confidence_level: ConfidenceLevel;
  source_url: string | null;
  source_name: string | null;
  notes: string; // required — must explain the data limitation
}

export interface SeasonSummary {
  season: number;
  total_transfers: number;
  total_reported_nil_value: number | null;
  estimated_nil_market_size: number | null;
  source_url: string | null;
  source_name: string | null;
  notes: string;
}

export interface School {
  school_id: string;
  name: string;
  conference: string;
  state: string;
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// Seed-file envelope. Every JSON seed file carries a `_meta` block so the
// "this is sample data" disclaimer travels with the data itself.
// ---------------------------------------------------------------------------

export interface SeedMeta {
  is_sample_data: boolean;
  last_updated: string;
  disclaimer: string;
}

export interface SeedFile<T> {
  _meta: SeedMeta;
  data: T[];
}

// ---------------------------------------------------------------------------
// Derived / view-model types used by the data-access layer and charts.
// ---------------------------------------------------------------------------

/** A single year point for the transfer timeline. */
export interface TransferYearPoint {
  season: number;
  total_transfers: number;
  /** Event label when this year is annotated (portal launch, NIL rules). */
  event: string | null;
}

/** One directed flow edge for the Sankey diagram. */
export interface FlowEdge {
  from: string;
  to: string;
  count: number;
}

/** Aggregated flow graph for a season (conference- or school-level). */
export interface FlowGraph {
  season: number;
  level: "conference" | "school";
  nodes: string[];
  edges: FlowEdge[];
}

/** A NIL deal joined to its player for table/chart display. */
export interface NILDealWithPlayer extends NILDeal {
  player: Player | null;
}

/** Aggregated NIL value for a category (position / school / conference). */
export interface NILAggregate {
  key: string;
  total_reported: number;
  deal_count: number;
  /** Worst (least certain) confidence level present in the bucket. */
  confidence: ConfidenceLevel;
}

/** Inbound vs outbound transfer counts for a conference. */
export interface ConferenceFlowBalance {
  conference: string;
  inbound: number;
  outbound: number;
  net: number;
}
