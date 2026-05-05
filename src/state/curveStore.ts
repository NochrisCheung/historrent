/**
 * Tunable curve uniforms.
 *
 * The values here drive both the vertex shader on the timeline string
 * (in `TimelineString.tsx`) and the y-displacement of items
 * (`TimelineItem.tsx`), so they stay in lockstep as the curl deepens or
 * shallows. During Phase 7 visual iteration the dev-only `<CurveTuner>`
 * pushes user-tweaked values into this store; production runs use the
 * defaults until the user signs off (Phase 11) and we re-bake them as
 * constants.
 */

import { create } from "zustand";
import { DEFAULT_CURVE_UNIFORMS, type CurveUniforms } from "@/components/canvas/geometry/curve";

/**
 * The curve's *shape* uniforms — everything except `uCurveCenter`, which
 * mirrors `cameraStore.cameraX` and is combined in `TimelineString` /
 * `TimelineItem` at render time.
 */
type CurveShape = Omit<CurveUniforms, "uCurveCenter">;

interface CurveState extends CurveShape {
  setUniforms: (next: Partial<CurveShape>) => void;
  reset: () => void;
}

const INITIAL_SHAPE: CurveShape = {
  uCenterFlatHalfWidth: DEFAULT_CURVE_UNIFORMS.uCenterFlatHalfWidth,
  uCurveAmount: DEFAULT_CURVE_UNIFORMS.uCurveAmount,
  uCurveSharpness: DEFAULT_CURVE_UNIFORMS.uCurveSharpness,
  uWobbleAmount: DEFAULT_CURVE_UNIFORMS.uWobbleAmount,
};

export const useCurveStore = create<CurveState>((set) => ({
  ...INITIAL_SHAPE,
  setUniforms: (next) => set(next),
  reset: () => set(INITIAL_SHAPE),
}));

/** Test affordance, same pattern as the other stores. */
declare global {
  interface Window {
    __historrentCurveStore?: typeof useCurveStore;
  }
}

if (typeof window !== "undefined") {
  window.__historrentCurveStore = useCurveStore;
}
