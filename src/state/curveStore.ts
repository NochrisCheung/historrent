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

interface CurveState extends CurveUniforms {
  setUniforms: (next: Partial<CurveUniforms>) => void;
  reset: () => void;
}

export const useCurveStore = create<CurveState>((set) => ({
  ...DEFAULT_CURVE_UNIFORMS,
  setUniforms: (next) => set(next),
  reset: () => set(DEFAULT_CURVE_UNIFORMS),
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
