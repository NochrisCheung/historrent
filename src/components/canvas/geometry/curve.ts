/**
 * Curve geometry — JS mirror of the vertex shader in `shaders.ts`.
 *
 * The curved-string timeline is straight in the centre and curls down at
 * the edges. The shader displaces vertex y-positions; this module performs
 * the same math in JS so items can "ride" the curve at the same y-offset
 * as the string they sit above.
 *
 * Uniform semantics:
 *  - `uCenterFlatHalfWidth`: world-x distance from origin where the string
 *    stays straight. The curl begins at xAbs > uCenterFlatHalfWidth.
 *  - `uCurveAmount`: maximum y-displacement (negative = down) at the edges.
 *  - `uCurveSharpness`: world-x width of the smoothstep transition between
 *    flat and full curl.
 *
 * Final values are locked during Phase 11 visual iteration with the user.
 * Defaults below give a moderate curl that visibly bends the lifespan
 * extremes (-5, +5) without obscuring items near them.
 */

export interface CurveUniforms {
  uCenterFlatHalfWidth: number;
  uCurveAmount: number;
  uCurveSharpness: number;
}

export const DEFAULT_CURVE_UNIFORMS: CurveUniforms = {
  uCenterFlatHalfWidth: 3,
  uCurveAmount: 1,
  uCurveSharpness: 2,
};

/** GLSL-style smoothstep: 0 at edge0, 1 at edge1, smooth in between. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi);
}

/**
 * Y-displacement at a given world-x for the supplied uniforms.
 * Returns a non-positive number (the string sags downward); normalised so the
 * flat zone returns positive zero rather than JavaScript's `-0`.
 */
export function curveYAt(x: number, u: CurveUniforms): number {
  const xAbs = Math.abs(x);
  const beyondFlat = Math.max(xAbs - u.uCenterFlatHalfWidth, 0);
  const t = smoothstep(0, u.uCurveSharpness, beyondFlat);
  const offset = t * u.uCurveAmount;
  return offset === 0 ? 0 : -offset;
}
