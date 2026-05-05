/**
 * Uniform shape for the timeline string's shader material.
 *
 * Phase 8.5.11 stripped the curl/wave; the string is a flat horizontal
 * line whose visible left/right ends fade to transparent. The remaining
 * uniforms drive that fade:
 *
 *  - `uCurveCenter` mirrors `cameraStore.cameraX` so the fade pivot
 *    follows the camera.
 *  - `uViewportHalfWidth` is `GRANULARITY_WIDTHS.year / 2 = 6` — a
 *    constant since 8.5.9 fixed the camera zoom.
 *  - `uAlphaFalloffStart` / `uAlphaFalloffEnd` define the smoothstep
 *    range applied to `|world_x − cameraX| / viewport-half-width`.
 *    Tunable via the Leva panel during dev.
 */

import { GRANULARITY_WIDTHS } from "@/state/cameraStore";
import { DEFAULT_FRAGMENT_UNIFORMS } from "../shaders";

export interface CurveUniforms {
  /** World-x where the alpha-fade is centred — tracks the camera. */
  uCurveCenter: number;
  /** Half the camera's visible world width; constant after 8.5.9. */
  uViewportHalfWidth: number;
  /** Normalised-distance threshold where the alpha fade begins. */
  uAlphaFalloffStart: number;
  /** Normalised-distance threshold where the string is fully transparent. */
  uAlphaFalloffEnd: number;
}

export const VIEWPORT_HALF_WIDTH = GRANULARITY_WIDTHS.year / 2;

/** Locked-in defaults from Phase 8.5.11 (2026-05-05). */
export const DEFAULT_CURVE_UNIFORMS: CurveUniforms = {
  uCurveCenter: 0,
  uViewportHalfWidth: VIEWPORT_HALF_WIDTH,
  uAlphaFalloffStart: DEFAULT_FRAGMENT_UNIFORMS.alphaFalloffStart,
  uAlphaFalloffEnd: DEFAULT_FRAGMENT_UNIFORMS.alphaFalloffEnd,
};
