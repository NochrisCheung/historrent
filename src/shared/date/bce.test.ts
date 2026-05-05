import { describe, it, expect } from "vitest";
import { parseEdtf, yearsBetween, nextYear, isValidColloquialYear, formatYear } from "./bce";

describe("parseEdtf", () => {
  it("parses an exact BCE year", () => {
    expect(parseEdtf("-0256")).toEqual({
      startEarliest: -256,
      startLatest: -256,
      endEarliest: -256,
      endLatest: -256,
      precision: "year",
    });
  });

  it("parses an exact CE year", () => {
    expect(parseEdtf("0195")).toEqual({
      startEarliest: 195,
      startLatest: 195,
      endEarliest: 195,
      endLatest: 195,
      precision: "year",
    });
  });

  it("parses an uncertain year (?) with the same numeric bounds as exact", () => {
    expect(parseEdtf("-0256?").startEarliest).toBe(-256);
    expect(parseEdtf("-0256?").endLatest).toBe(-256);
  });

  it("parses an approximate year (~) with the same numeric bounds as exact", () => {
    expect(parseEdtf("-0256~").startEarliest).toBe(-256);
    expect(parseEdtf("-0256~").endLatest).toBe(-256);
  });

  it("parses an interval — Liu Bang's disputed birth year", () => {
    expect(parseEdtf("-0256/-0247")).toEqual({
      startEarliest: -256,
      startLatest: -247,
      endEarliest: -256,
      endLatest: -247,
      precision: "year",
    });
  });

  it("rejects year 0", () => {
    expect(() => parseEdtf("0000")).toThrow(/Year 0 is invalid/);
  });

  it("rejects malformed inputs", () => {
    expect(() => parseEdtf("256 BCE")).toThrow(/Unsupported EDTF/);
    expect(() => parseEdtf("")).toThrow(/Unsupported EDTF/);
    expect(() => parseEdtf("-256")).toThrow(/Unsupported EDTF/); // 3 digits, not 4
  });
});

describe("yearsBetween", () => {
  it("computes the lifespan within BCE without crossing zero", () => {
    expect(yearsBetween(-256, -195)).toBe(61);
  });

  it("computes the lifespan within CE without crossing zero", () => {
    expect(yearsBetween(100, 200)).toBe(100);
  });

  it("skips the non-existent year 0 when crossing the BCE/CE boundary", () => {
    // From 1 BCE (-1) to 1 CE (+1) is 1 year, not 2.
    expect(yearsBetween(-1, 1)).toBe(1);
    expect(yearsBetween(-50, 50)).toBe(99);
  });

  it("is order-insensitive", () => {
    expect(yearsBetween(-195, -256)).toBe(61);
    expect(yearsBetween(50, -50)).toBe(99);
  });

  it("rejects year 0 inputs", () => {
    expect(() => yearsBetween(0, 100)).toThrow(/Invalid colloquial signed-BCE/);
  });
});

describe("nextYear", () => {
  it("steps forward in BCE", () => {
    expect(nextYear(-256)).toBe(-255);
  });

  it("steps from 1 BCE to 1 CE (skipping year 0)", () => {
    expect(nextYear(-1)).toBe(1);
  });

  it("steps forward in CE", () => {
    expect(nextYear(100)).toBe(101);
  });
});

describe("isValidColloquialYear", () => {
  it.each([-256, -1, 1, 100])("accepts %d", (y) => {
    expect(isValidColloquialYear(y)).toBe(true);
  });

  it.each([0, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("rejects %s", (y) => {
    expect(isValidColloquialYear(y)).toBe(false);
  });
});

describe("formatYear", () => {
  it("renders BCE in English", () => {
    expect(formatYear(-256, "en")).toBe("256 BCE");
  });

  it("renders CE in English", () => {
    expect(formatYear(195, "en")).toBe("195 CE");
  });

  it("renders BCE in Simplified and Traditional Chinese", () => {
    expect(formatYear(-256, "zh-Hans")).toBe("前256年");
    expect(formatYear(-256, "zh-Hant")).toBe("前256年");
  });

  it("renders CE in Simplified and Traditional Chinese", () => {
    expect(formatYear(195, "zh-Hans")).toBe("公元195年");
    expect(formatYear(195, "zh-Hant")).toBe("公元195年");
  });

  it("rejects year 0", () => {
    expect(() => formatYear(0, "en")).toThrow(/Invalid colloquial signed-BCE/);
  });
});
