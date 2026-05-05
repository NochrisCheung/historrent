import { describe, it, expect } from "vitest";
import { formatFuzzyDate } from "./formatFuzzyDate";
import type { TFuzzyDate } from "@/data/liu_bang.schema";

const exact = (year: number): TFuzzyDate => ({
  edtf: year < 0 ? `-${String(-year).padStart(4, "0")}` : String(year).padStart(4, "0"),
  precision: "year",
  startEarliest: year,
  startLatest: year,
  endEarliest: year,
  endLatest: year,
});

const range = (early: number, late: number): TFuzzyDate => ({
  edtf: `${early}/${late}`,
  precision: "year",
  startEarliest: early,
  startLatest: late,
  endEarliest: early,
  endLatest: late,
});

describe("formatFuzzyDate", () => {
  it("renders an exact BCE year", () => {
    expect(formatFuzzyDate(exact(-202), "zh-Hans")).toBe("前202年");
    expect(formatFuzzyDate(exact(-202), "zh-Hant")).toBe("前202年");
    expect(formatFuzzyDate(exact(-202), "en")).toBe("202 BCE");
  });

  it("renders an exact CE year", () => {
    expect(formatFuzzyDate(exact(195), "zh-Hans")).toBe("公元195年");
    expect(formatFuzzyDate(exact(195), "en")).toBe("195 CE");
  });

  it("renders a fuzzy range as start–end", () => {
    expect(formatFuzzyDate(range(-256, -247), "zh-Hans")).toBe("前256年–前247年");
    expect(formatFuzzyDate(range(-256, -247), "en")).toBe("256 BCE–247 BCE");
  });
});
