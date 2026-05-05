import { describe, it, expect } from "vitest";
import { centralYear } from "./centralYear";
import type { TFuzzyDate } from "@/data/liu_bang.schema";

function exact(year: number): TFuzzyDate {
  return {
    edtf: year < 0 ? `-${String(-year).padStart(4, "0")}` : String(year).padStart(4, "0"),
    precision: "year",
    startEarliest: year,
    startLatest: year,
    endEarliest: year,
    endLatest: year,
  };
}

function range(early: number, late: number): TFuzzyDate {
  return {
    edtf: `${early}/${late}`,
    precision: "year",
    startEarliest: early,
    startLatest: late,
    endEarliest: early,
    endLatest: late,
  };
}

describe("centralYear", () => {
  it("returns the year unchanged for an exact year", () => {
    expect(centralYear(exact(-202))).toBe(-202);
    expect(centralYear(exact(195))).toBe(195);
  });

  it("returns the rounded midpoint for a fuzzy range — Liu Bang's disputed birth", () => {
    // (-256 + -247) / 2 = -251.5 → -251 (JS Math.round rounds toward +Infinity).
    expect(centralYear(range(-256, -247))).toBe(-251);
  });

  it("nudges away from year 0 when a fuzzy range straddles BCE/CE", () => {
    // (-1 + 1) / 2 = 0 → would land on the non-existent year 0.
    expect(centralYear(range(-1, 1))).toBe(-1);
  });
});
