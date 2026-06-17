import { describe, it, expect } from "vitest";
import {
  getNILDeals,
  getNILDealsWithPlayers,
  getTopDeals,
  getNILByPosition,
  getNILBySchool,
  getNILByConference,
  getConfidenceMix,
  getDealByPlayerId,
} from "@/lib/data/nil";

describe("nil deals access", () => {
  it("returns the full deal set", () => {
    expect(getNILDeals().length).toBeGreaterThanOrEqual(40);
  });

  it("every deal has non-empty notes", () => {
    expect(getNILDeals().every((d) => d.notes.trim().length > 0)).toBe(true);
  });

  it("joins players (most resolve to a real player)", () => {
    const joined = getNILDealsWithPlayers();
    expect(joined.every((d) => d.player === null || d.player.player_id === d.player_id)).toBe(true);
  });
});

describe("getTopDeals", () => {
  it("excludes unknown amounts and sorts descending", () => {
    const top = getTopDeals(10);
    expect(top.length).toBeLessThanOrEqual(10);
    expect(top.every((d) => d.reported_amount !== null)).toBe(true);
    for (let i = 1; i < top.length; i++) {
      expect((top[i - 1].reported_amount ?? 0)).toBeGreaterThanOrEqual(top[i].reported_amount ?? 0);
    }
  });
});

describe("aggregations carry honest confidence", () => {
  it("by position: confidence is the worst level in each bucket", () => {
    const agg = getNILByPosition();
    expect(agg.length).toBeGreaterThan(0);
    // Sample data is mostly estimated/unknown, so no bucket should claim 'confirmed'.
    expect(agg.every((a) => a.confidence !== "confirmed")).toBe(true);
    expect(agg.every((a) => a.total_reported >= 0 && a.deal_count > 0)).toBe(true);
  });

  it("by school is limited and sorted by total", () => {
    const agg = getNILBySchool(5);
    expect(agg.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < agg.length; i++) {
      expect(agg[i - 1].total_reported).toBeGreaterThanOrEqual(agg[i].total_reported);
    }
  });

  it("by conference returns known conferences", () => {
    const agg = getNILByConference();
    expect(agg.length).toBeGreaterThan(0);
  });
});

describe("getDealByPlayerId", () => {
  it("maps each dealt player to a deal", () => {
    const map = getDealByPlayerId();
    expect(map.size).toBeGreaterThan(0);
    for (const [playerId, deal] of map) expect(deal.player_id).toBe(playerId);
  });
});

describe("confidence mix", () => {
  it("returns counts for all four levels in fixed order", () => {
    const mix = getConfidenceMix();
    expect(mix.map((m) => m.level)).toEqual(["confirmed", "reported", "estimated", "unknown"]);
    expect(mix.reduce((s, m) => s + m.count, 0)).toBe(getNILDeals().length);
    // Mostly estimated/reported, at most 5 confirmed.
    const confirmed = mix.find((m) => m.level === "confirmed")!.count;
    expect(confirmed).toBeLessThanOrEqual(5);
  });
});
