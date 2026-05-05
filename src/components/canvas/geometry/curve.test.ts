import { describe, it, expect } from "vitest";
import { curveYAt, smoothstep, DEFAULT_CURVE_UNIFORMS, type CurveUniforms } from "./curve";

const U: CurveUniforms = DEFAULT_CURVE_UNIFORMS; // { 3, 1, 2 }

describe("smoothstep", () => {
  it("returns 0 at or below edge0", () => {
    expect(smoothstep(0, 1, -0.5)).toBe(0);
    expect(smoothstep(0, 1, 0)).toBe(0);
  });

  it("returns 1 at or above edge1", () => {
    expect(smoothstep(0, 1, 1)).toBe(1);
    expect(smoothstep(0, 1, 1.5)).toBe(1);
  });

  it("returns 0.5 at the midpoint", () => {
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
  });

  it("is symmetric about the midpoint", () => {
    expect(smoothstep(0, 1, 0.25)).toBeCloseTo(1 - smoothstep(0, 1, 0.75), 10);
  });
});

describe("curveYAt", () => {
  it("returns 0 at the centre (flat zone)", () => {
    expect(curveYAt(0, U)).toBe(0);
    expect(curveYAt(2, U)).toBe(0);
    expect(curveYAt(2.99, U)).toBeCloseTo(0, 5);
  });

  it("starts dropping just past uCenterFlatHalfWidth", () => {
    expect(curveYAt(3, U)).toBe(0);
    // Just past the flat boundary — drops slightly.
    expect(curveYAt(3.5, U)).toBeLessThan(0);
    expect(curveYAt(3.5, U)).toBeGreaterThan(-U.uCurveAmount);
  });

  it("reaches full curl at uCenterFlatHalfWidth + uCurveSharpness", () => {
    // At xAbs = 3 + 2 = 5, beyondFlat = 2 = uCurveSharpness, so t = 1.
    expect(curveYAt(5, U)).toBeCloseTo(-U.uCurveAmount, 5);
    expect(curveYAt(-5, U)).toBeCloseTo(-U.uCurveAmount, 5);
  });

  it("is symmetric about x = 0", () => {
    expect(curveYAt(3.5, U)).toBeCloseTo(curveYAt(-3.5, U), 10);
    expect(curveYAt(4.7, U)).toBeCloseTo(curveYAt(-4.7, U), 10);
  });

  it("respects custom uniforms", () => {
    const tight: CurveUniforms = { uCenterFlatHalfWidth: 1, uCurveAmount: 2, uCurveSharpness: 1 };
    // At xAbs = 2, beyondFlat = 1 = sharpness, so full curl at -2.
    expect(curveYAt(2, tight)).toBeCloseTo(-2, 5);
    expect(curveYAt(0.5, tight)).toBe(0);
  });
});
