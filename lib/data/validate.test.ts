import { describe, it, expect } from "vitest";
import { loadSeed, collectSeedErrors, validateSeed, type SeedBundle } from "@/lib/data/validate";
import type { NILDeal } from "@/lib/types";

describe("seed integrity — real data", () => {
  it("the committed seed passes validation", () => {
    expect(() => validateSeed(loadSeed())).not.toThrow();
    expect(collectSeedErrors(loadSeed())).toEqual([]);
  });

  it("meets the documented minimum row counts", () => {
    const seed = loadSeed();
    expect(seed.players.data.length).toBeGreaterThanOrEqual(250);
    expect(seed.nilDeals.data.length).toBeGreaterThanOrEqual(40);
    expect(seed.seasons.data.length).toBeGreaterThanOrEqual(20);
    expect(seed.schools.data.length).toBeGreaterThanOrEqual(25);
  });

  it("has at most 5 confirmed NIL deals, each with a source_url", () => {
    const confirmed = loadSeed().nilDeals.data.filter((d) => d.confidence_level === "confirmed");
    expect(confirmed.length).toBeLessThanOrEqual(5);
    for (const d of confirmed) expect(d.source_url).toBeTruthy();
  });
});

describe("seed integrity — the key rule", () => {
  // Clone the real seed and corrupt one deal to prove the rule fires.
  function bundleWithBadDeal(mutate: (d: NILDeal) => NILDeal): SeedBundle {
    const seed = loadSeed();
    const deals = seed.nilDeals.data.map((d, i) => (i === 0 ? mutate({ ...d }) : d));
    return { ...seed, nilDeals: { ...seed.nilDeals, data: deals } };
  }

  it("fails when a confirmed deal has a null source_url", () => {
    const bad = bundleWithBadDeal((d) => ({
      ...d,
      confidence_level: "confirmed",
      source_url: null,
      reported_amount: d.reported_amount ?? 100000,
      amount_type: "exact",
    }));
    const errors = collectSeedErrors(bad);
    expect(errors.some((e) => e.includes("confirmed but has no source_url"))).toBe(true);
    expect(() => validateSeed(bad)).toThrow(/confirmed but has no source_url/);
  });

  it("fails when a deal has empty notes", () => {
    const bad = bundleWithBadDeal((d) => ({ ...d, notes: "   " }));
    expect(collectSeedErrors(bad).some((e) => e.includes("empty notes"))).toBe(true);
  });

  it("fails when an unknown amount carries a dollar figure", () => {
    const bad = bundleWithBadDeal((d) => ({ ...d, amount_type: "unknown", reported_amount: 50000 }));
    expect(collectSeedErrors(bad).some((e) => e.includes('amount_type "unknown" but has a reported_amount'))).toBe(true);
  });
});

describe("seed integrity — provenance & display rules", () => {
  function bundleWithBadDeal(mutate: (d: NILDeal) => NILDeal): SeedBundle {
    const seed = loadSeed();
    const deals = seed.nilDeals.data.map((d, i) => (i === 0 ? mutate({ ...d }) : d));
    return { ...seed, nilDeals: { ...seed.nilDeals, data: deals } };
  }

  it("fails when a source_url is not a valid http(s) URL", () => {
    const bad = bundleWithBadDeal((d) => ({ ...d, source_url: "not-a-url", source_name: "X" }));
    expect(collectSeedErrors(bad).some((e) => e.includes("not a valid http(s) URL"))).toBe(true);
  });

  it("fails when a source_url has no source_name label", () => {
    const bad = bundleWithBadDeal((d) => ({ ...d, source_url: "https://example.com", source_name: "" }));
    expect(collectSeedErrors(bad).some((e) => e.includes("source_url but an empty source_name"))).toBe(true);
  });

  it("fails when a confirmed deal has no source_name", () => {
    const bad = bundleWithBadDeal((d) => ({
      ...d,
      confidence_level: "confirmed",
      source_url: "https://example.com",
      source_name: "",
      amount_type: "exact",
      reported_amount: d.reported_amount ?? 100000,
    }));
    expect(collectSeedErrors(bad).some((e) => e.includes("confirmed but has no source_name"))).toBe(true);
  });

  it("fails when a reported deal cites no source at all", () => {
    const bad = bundleWithBadDeal((d) => ({
      ...d,
      confidence_level: "reported",
      source_url: null,
      source_name: null,
      amount_type: "range",
      reported_amount: d.reported_amount ?? 100000,
    }));
    expect(collectSeedErrors(bad).some((e) => e.includes("reported but cites no source"))).toBe(true);
  });

  it("fails when an estimated deal claims an exact amount type", () => {
    const bad = bundleWithBadDeal((d) => ({
      ...d,
      confidence_level: "estimated",
      amount_type: "exact",
      reported_amount: d.reported_amount ?? 50000,
      source_url: null,
      source_name: null,
    }));
    expect(collectSeedErrors(bad).some((e) => e.includes('amount_type "exact" (would imply precision)'))).toBe(true);
  });
});
