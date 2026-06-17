import { describe, it, expect } from "vitest";
import {
  getPlayers,
  getPlayersBySeason,
  filterPlayers,
  getTransferCountsByYear,
  getPositionCounts,
  getMostTransferredPosition,
  getTopDestinationConference,
  getFlowGraph,
  getConferenceFlowBalance,
} from "@/lib/data/players";

describe("players access", () => {
  it("returns the full sample set", () => {
    expect(getPlayers().length).toBeGreaterThanOrEqual(250);
  });

  it("getPlayersBySeason filters by year", () => {
    const rows = getPlayersBySeason(2024);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((p) => p.season === 2024)).toBe(true);
  });
});

describe("filterPlayers", () => {
  it("no filters is a no-op", () => {
    expect(filterPlayers({}).length).toBe(getPlayers().length);
  });

  it("filters by season range", () => {
    const rows = filterPlayers({ seasonMin: 2022, seasonMax: 2024 });
    expect(rows.every((p) => p.season >= 2022 && p.season <= 2024)).toBe(true);
  });

  it("filters by position", () => {
    const rows = filterPlayers({ positions: ["QB"] });
    expect(rows.every((p) => p.position === "QB")).toBe(true);
  });

  it("matches conference on either side of the move", () => {
    const rows = filterPlayers({ conferences: ["SEC"] });
    expect(rows.every((p) => p.from_conference === "SEC" || p.to_conference === "SEC")).toBe(true);
  });

  it("search is case-insensitive on player name", () => {
    const sample = getPlayers()[0];
    const term = sample.player_name.slice(0, 4).toUpperCase();
    const rows = filterPlayers({ search: term });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((p) => p.player_name.toLowerCase().includes(term.toLowerCase()))).toBe(true);
  });
});

describe("aggregations", () => {
  it("transfer counts cover every season ascending", () => {
    const counts = getTransferCountsByYear();
    expect(counts[0].season).toBe(2005);
    expect(counts[counts.length - 1].season).toBe(2024);
    // High-mobility era has more sample rows than the pre-portal era.
    const c2024 = counts.find((c) => c.season === 2024)!.count;
    const c2005 = counts.find((c) => c.season === 2005)!.count;
    expect(c2024).toBeGreaterThan(c2005);
  });

  it("position counts are sorted descending and sum to the total", () => {
    const counts = getPositionCounts();
    const sum = counts.reduce((s, c) => s + c.count, 0);
    expect(sum).toBe(getPlayers().length);
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i - 1].count).toBeGreaterThanOrEqual(counts[i].count);
    }
  });

  it("most-transferred position and top destination conference are defined", () => {
    expect(getMostTransferredPosition()).not.toBeNull();
    expect(getTopDestinationConference()).not.toBeNull();
  });
});

describe("flow graph", () => {
  it("conference-level graph has no self edges and aggregates counts", () => {
    const g = getFlowGraph(2024, "conference");
    expect(g.level).toBe("conference");
    expect(g.edges.every((e) => e.from !== e.to)).toBe(true);
    expect(g.edges.every((e) => e.count >= 1)).toBe(true);
    // Edges are sorted by count descending.
    for (let i = 1; i < g.edges.length; i++) {
      expect(g.edges[i - 1].count).toBeGreaterThanOrEqual(g.edges[i].count);
    }
  });

  it("school-level graph restricts to the top schools", () => {
    const g = getFlowGraph(2024, "school", 15);
    expect(g.nodes.length).toBeLessThanOrEqual(15);
  });
});

describe("conference flow balance", () => {
  it("net equals inbound minus outbound", () => {
    const balances = getConferenceFlowBalance();
    expect(balances.length).toBeGreaterThan(0);
    for (const b of balances) expect(b.net).toBe(b.inbound - b.outbound);
  });
});
