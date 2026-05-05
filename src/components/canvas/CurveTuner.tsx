"use client";

import { Leva, useControls } from "leva";
import { useEffect } from "react";
import { useCurveStore } from "@/state/curveStore";
import { DEFAULT_CURVE_UNIFORMS } from "./geometry/curve";

/**
 * Dev-only Leva panel for tuning the curve uniforms during Phase 7
 * (and Phase 11 visual finalisation).
 *
 * Mounted from `<Home>` only when `process.env.NODE_ENV === 'development'`,
 * so the Leva panel isn't shipped to production. The values it produces
 * are pushed into `useCurveStore`, which `TimelineString` and
 * `TimelineItem` already subscribe to.
 *
 * After Phase 11 sign-off, the locked-in values can be either:
 *  - Re-baked as the new defaults in `geometry/curve.ts`, leaving Leva for
 *    future tuning, or
 *  - Removed entirely if no further iteration is expected.
 */
export function CurveTuner() {
  const setUniforms = useCurveStore((s) => s.setUniforms);

  const tuned = useControls("Curve", {
    uCenterFlatHalfWidth: {
      value: DEFAULT_CURVE_UNIFORMS.uCenterFlatHalfWidth,
      min: 0,
      max: 15,
      step: 0.05,
      label: "flat half-width",
    },
    uCurveAmount: {
      value: DEFAULT_CURVE_UNIFORMS.uCurveAmount,
      min: 0,
      max: 4,
      step: 0.05,
      label: "curl amount",
    },
    uCurveSharpness: {
      value: DEFAULT_CURVE_UNIFORMS.uCurveSharpness,
      min: 1,
      max: 20,
      step: 0.1,
      label: "curl sharpness",
    },
    uWobbleAmount: {
      value: DEFAULT_CURVE_UNIFORMS.uWobbleAmount,
      min: 0,
      max: 1.5,
      step: 0.01,
      label: "wobble (sides)",
    },
  });

  useEffect(() => {
    setUniforms(tuned);
  }, [tuned, setUniforms]);

  return <Leva collapsed={false} />;
}
