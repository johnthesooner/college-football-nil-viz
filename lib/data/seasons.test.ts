import { describe, it, expect } from "vitest";
import {
  getSeasonSummaries,
  getSeasonSummary,
  getSeasonRange,
  getLatestSeason,
  getTransferTimeline,
  getLatestEstimatedMarketSize,
  SEASON_EVENTS,
} from "@/lib/data/seasons";

describe("seasons access", () => {
  it("covers 2005–2024 ascending", () => {
    const s = getSeasonSummaries();
    expect(s[0].season).toBe(2005);
    expect(s[s.length - 1].season).toBe(2024);
    expect(getSeasonRange()).toEqual([2005, 2024]);
    expect(getLatestSeason()).toBe(2024);
  });

  it("pre-NIL seasons have null NIL fields", () => {
    const s2019 = getSeasonSummary(2019)!;
    expect(s2019.total_reported_nil_value).toBeNull();
    expect(s2019.estimated_nil_market_size).toBeNull();
  });

  it("NIL-era seasons expose an estimated market size", () => {
    const s2024 = getSeasonSummary(2024)!;
    expect(s2024.estimated_nil_market_size).not.toBeNull();
  });
});

describe("timeline annotations", () => {
  it("annotates portal launch (2018) and NIL rules (2021)", () => {
    const timeline = getTransferTimeline();
    const e2018 = timeline.find((t) => t.season === 2018)!;
    const e2021 = timeline.find((t) => t.season === 2021)!;
    expect(e2018.event).toBe(SEASON_EVENTS[2018]);
    expect(e2021.event).toBe(SEASON_EVENTS[2021]);
    expect(timeline.find((t) => t.season === 2010)!.event).toBeNull();
  });
});

describe("latest estimated market size", () => {
  it("returns the most recent NIL-era estimate", () => {
    const latest = getLatestEstimatedMarketSize();
    expect(latest).not.toBeNull();
    expect(latest!.season).toBe(2024);
    expect(latest!.value).toBeGreaterThan(0);
  });
});
