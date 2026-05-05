import { describe, it, expect } from "vitest";
import {
  curveYAt,
  curveWave,
  smoothstep,
  DEFAULT_CURVE_UNIFORMS,
  type CurveUniforms,
} from "./curve";

/** No-wobble + clean drop, used to assert the underlying smoothstep shape. */
const CLEAN: CurveUniforms = {
  uCurveCenter: 0,
  uCenterFlatHalfWidth: 5,
  uCurveAmount: 1,
  uCurveSharpness: 8,
  uWobbleAmount: 0,
};

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

describe("curveYAt — clean shape (wobble disabled)", () => {
  it("returns 0 throughout the held flat zone", () => {
    expect(curveYAt(0, CLEAN)).toBe(0);
    expect(curveYAt(3, CLEAN)).toBe(0);
    expect(curveYAt(5, CLEAN)).toBe(0);
  });

  it("starts dropping just past uCenterFlatHalfWidth", () => {
    expect(curveYAt(5.5, CLEAN)).toBeLessThan(0);
    expect(curveYAt(5.5, CLEAN)).toBeGreaterThan(-CLEAN.uCurveAmount);
  });

  it("reaches full curl at uCenterFlatHalfWidth + uCurveSharpness", () => {
    // At xAbs = 5 + 8 = 13, beyondFlat = 8 = uCurveSharpness, envelope = 1.
    expect(curveYAt(13, CLEAN)).toBeCloseTo(-CLEAN.uCurveAmount, 5);
    expect(curveYAt(-13, CLEAN)).toBeCloseTo(-CLEAN.uCurveAmount, 5);
  });

  it("is symmetric about x = 0 when wobble is disabled", () => {
    expect(curveYAt(8, CLEAN)).toBeCloseTo(curveYAt(-8, CLEAN), 10);
    expect(curveYAt(11.3, CLEAN)).toBeCloseTo(curveYAt(-11.3, CLEAN), 10);
  });
});

describe("curveWave", () => {
  it("is bounded by ±1.0 across the lifespan and string range", () => {
    for (let x = -25; x <= 25; x += 0.1) {
      expect(Math.abs(curveWave(x))).toBeLessThanOrEqual(1.0);
    }
  });

  it("is asymmetric about x = 0 (phase shifts break sin's odd symmetry)", () => {
    expect(curveWave(8)).not.toBeCloseTo(-curveWave(-8), 2);
    expect(curveWave(13)).not.toBeCloseTo(-curveWave(-13), 2);
  });
});

describe("curveYAt — with scarf wobble", () => {
  it("keeps the held flat zone EXACTLY flat (no wobble bleeds in)", () => {
    // Anywhere within ±uCenterFlatHalfWidth around uCurveCenter is dead flat.
    const half = DEFAULT_CURVE_UNIFORMS.uCenterFlatHalfWidth;
    const centre = DEFAULT_CURVE_UNIFORMS.uCurveCenter;
    for (const offset of [0, half * 0.25, half * 0.5, half * 0.75, half]) {
      expect(curveYAt(centre + offset, DEFAULT_CURVE_UNIFORMS)).toBe(0);
      expect(curveYAt(centre - offset, DEFAULT_CURVE_UNIFORMS)).toBe(0);
    }
  });

  it("is asymmetric at the curl tails (left vs right drop differ)", () => {
    const centre = DEFAULT_CURVE_UNIFORMS.uCurveCenter;
    const far =
      DEFAULT_CURVE_UNIFORMS.uCenterFlatHalfWidth + DEFAULT_CURVE_UNIFORMS.uCurveSharpness + 4;
    const yLeft = curveYAt(centre - far, DEFAULT_CURVE_UNIFORMS);
    const yRight = curveYAt(centre + far, DEFAULT_CURVE_UNIFORMS);
    expect(yLeft).toBeLessThan(0); // both still drop
    expect(yRight).toBeLessThan(0);
    expect(Math.abs(yLeft - yRight)).toBeGreaterThan(0.01);
  });

  it("stays within a sane envelope across the full string extent", () => {
    // |y| ≤ uCurveAmount + uWobbleAmount * 1.0 (max |wave|)
    const envelope =
      DEFAULT_CURVE_UNIFORMS.uCurveAmount + DEFAULT_CURVE_UNIFORMS.uWobbleAmount * 1.0;
    for (let x = -25; x <= 25; x += 0.1) {
      expect(Math.abs(curveYAt(x, DEFAULT_CURVE_UNIFORMS))).toBeLessThanOrEqual(envelope + 1e-9);
    }
  });

  it("respects custom uniforms", () => {
    const tight: CurveUniforms = {
      uCurveCenter: 0,
      uCenterFlatHalfWidth: 1,
      uCurveAmount: 2,
      uCurveSharpness: 1,
      uWobbleAmount: 0,
    };
    // At xAbs = 2, beyondFlat = 1 = sharpness, envelope = 1, so drop = 2.
    expect(curveYAt(2, tight)).toBeCloseTo(-2, 5);
    expect(curveYAt(0.5, tight)).toBe(0);
  });
});

describe("curveYAt — with non-zero uCurveCenter", () => {
  it("translates the held flat zone to be around uCurveCenter", () => {
    const u: CurveUniforms = { ...CLEAN, uCurveCenter: -4 };
    // Held flat zone now sits at [-4 - 5, -4 + 5] = [-9, 1].
    expect(curveYAt(-4, u)).toBe(0); // dead centre
    expect(curveYAt(-9, u)).toBe(0); // left edge of flat zone
    expect(curveYAt(1, u)).toBe(0); // right edge of flat zone
    // World-origin is now inside the flat zone too.
    expect(curveYAt(0, u)).toBe(0);
  });

  it("the curl drops symmetrically around uCurveCenter", () => {
    const u: CurveUniforms = { ...CLEAN, uCurveCenter: -4 };
    expect(curveYAt(-4 - 13, u)).toBeCloseTo(curveYAt(-4 + 13, u), 5);
  });
});
