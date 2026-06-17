import { describe, it, expect } from "vitest";
import {
  cn,
  formatNumber,
  formatCompactCurrency,
  formatCurrency,
  formatNilAmount,
  clamp,
  pearson,
  titleCase,
} from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names and drops falsy", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
    expect(cn()).toBe("");
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(11000)).toBe("11,000");
    expect(formatNumber(5)).toBe("5");
  });
});

describe("formatCompactCurrency", () => {
  it("formats billions, millions, thousands", () => {
    expect(formatCompactCurrency(1_280_000_000)).toBe("$1.28B");
    expect(formatCompactCurrency(917_000_000)).toBe("$917M");
    expect(formatCompactCurrency(250_000)).toBe("$250K");
    expect(formatCompactCurrency(750)).toBe("$750");
  });
  it("handles negatives", () => {
    expect(formatCompactCurrency(-1_000_000)).toBe("-$1M");
  });
});

describe("formatCurrency", () => {
  it("formats full USD without cents", () => {
    expect(formatCurrency(250000)).toBe("$250,000");
  });
});

describe("formatNilAmount", () => {
  it("never invents a value for null", () => {
    expect(formatNilAmount(null)).toBe("Not disclosed");
  });
  it("formats known amounts", () => {
    expect(formatNilAmount(250000)).toBe("$250,000");
    expect(formatNilAmount(250000, true)).toBe("$250K");
  });
});

describe("clamp", () => {
  it("clamps into range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("pearson", () => {
  it("returns 1 for perfectly correlated series", () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6);
  });
  it("returns -1 for inverse series", () => {
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1, 6);
  });
  it("throws on mismatched lengths", () => {
    expect(() => pearson([1, 2], [1])).toThrow();
  });
});

describe("titleCase", () => {
  it("title-cases slugs", () => {
    expect(titleCase("big_ten")).toBe("Big Ten");
    expect(titleCase("transfer-portal")).toBe("Transfer Portal");
  });
});
