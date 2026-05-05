/**
 * Tunable shader uniforms for the timeline string's edge fade.
 *
 * Phase 8.5.11 stripped the curl/wave; only the two alpha-falloff
 * thresholds remain tunable here. `<TimelineString>` reads them and
 * passes them into the fragment-shader uniforms; `<CurveTuner>` (dev
 * only) pushes Leva slider values back into this store. Production runs
 * use the defaults until Phase 11 sign-off bakes them in.
 */

import { create } from "zustand";
import { DEFAULT_CURVE_UNIFORMS, type CurveUniforms } from "@/components/canvas/geometry/curve";

/**
 * The shape uniforms — everything except `uCurveCenter` (mirrors
 * `cameraStore.cameraX`) and `uViewportHalfWidth` (constant after 8.5.9).
 */
type CurveShape = Pick<CurveUniforms, "uAlphaFalloffStart" | "uAlphaFalloffEnd">;

interface CurveState extends CurveShape {
  setUniforms: (next: Partial<CurveShape>) => void;
  reset: () => void;
}

const INITIAL_SHAPE: CurveShape = {
  uAlphaFalloffStart: DEFAULT_CURVE_UNIFORMS.uAlphaFalloffStart,
  uAlphaFalloffEnd: DEFAULT_CURVE_UNIFORMS.uAlphaFalloffEnd,
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
