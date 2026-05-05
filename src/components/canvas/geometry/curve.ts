/**
 * Curve geometry — JS mirror of the vertex shader in `shaders.ts`.
 *
 * The string is treated like a flying scarf:
 *  - **Centre (within `uCenterFlatHalfWidth`)** is held nearly straight,
 *    with only a subtle scarf-flow wobble (`uCenterWobble`) so the lifespan
 *    items stay readable.
 *  - **Past the flat zone**, an envelope (`smoothstep(0, uCurveSharpness, ...)`)
 *    rises from 0 to 1 over `uCurveSharpness` world units, layering on:
 *      * a sustained drop of up to `uCurveAmount`,
 *      * an extra wave amplitude of up to `uEdgeWobble`,
 *    so the off-lifespan portion of the string undulates with growing freedom.
 *
 * The wave itself is a phase-shifted multi-frequency sine — deterministic
 * (no time term), asymmetric between +x and -x so the two ends don't mirror
 * each other.
 */

export interface CurveUniforms {
  /**
   * World-x where the curve is centred (the held-flat zone sits around it).
   * In Phase 7.5 this is set once to the first event's world-x; in Phase 8
   * it tracks the camera as the user pans, so the curl always recedes at
   * the viewport edges (plan §1.2: "the curve is a property of the viewport").
   */
  uCurveCenter: number;
  /** Distance from `uCurveCenter` (in world units) where the string stays held flat. */
  uCenterFlatHalfWidth: number;
  /** Maximum sustained drop at the curl tail (envelope = 1). */
  uCurveAmount: number;
  /** World-x width of the smoothstep transition from flat to full curl. */
  uCurveSharpness: number;
  /**
   * Wave amplitude at the curl tail (envelope = 1). The wave is gated by
   * the same envelope as the drop, so the held centre is dead flat;
   * the wobble only develops as the string leaves the held zone.
   */
  uWobbleAmount: number;
}

/**
 * Locked-in defaults from Phase 7.5 visual sign-off (2026-05-05).
 * `uCurveCenter` is overridden at mount to the first event's world-x.
 */
export const DEFAULT_CURVE_UNIFORMS: CurveUniforms = {
  uCurveCenter: 0,
  uCenterFlatHalfWidth: 4.5,
  uCurveAmount: 0.45,
  uCurveSharpness: 2,
  uWobbleAmount: 0.73,
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
 * Multi-frequency wave — deterministic, position-driven (not time-driven, so
 * no always-on animation loop). Phase-shifted sines break +x/−x symmetry so
 * the two scarf tails undulate with different rhythms. Bounded magnitude
 * ≤ 1.0 (the three amplitudes sum to 1.0).
 */
export function curveWave(x: number): number {
  return Math.sin(x * 0.35) * 0.5 + Math.sin(x * 0.85 + 1.3) * 0.3 + Math.sin(x * 1.7 + 2.7) * 0.2;
}

/**
 * Y-displacement at a given world-x for the supplied uniforms.
 * The curve is centred at `uCurveCenter` (set to the first event's world-x
 * at mount; tracks the camera in Phase 8). The held flat zone returns
 * exactly 0; past it, both the drop and the wobble are gated by the same
 * envelope so they fade in together.
 * Negative = down; positive = up (the wave can swing either way).
 */
export function curveYAt(x: number, u: CurveUniforms): number {
  const xRel = x - u.uCurveCenter;
  const xAbs = Math.abs(xRel);
  const beyondFlat = Math.max(xAbs - u.uCenterFlatHalfWidth, 0);
  if (beyondFlat === 0) return 0;
  const envelope = smoothstep(0, u.uCurveSharpness, beyondFlat);
  const wave = curveWave(xRel);
  return wave * envelope * u.uWobbleAmount - envelope * u.uCurveAmount;
}
