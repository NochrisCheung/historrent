"use client";

import { Leva, useControls } from "leva";
import { useEffect } from "react";
import { useCurveStore } from "@/state/curveStore";
import { DEFAULT_CURVE_UNIFORMS } from "./geometry/curve";

/**
 * Dev-only Leva panel for tuning the timeline string's edge fade.
 *
 * Phase 8.5.11 cut this down from 4 curve-shape sliders to 2 alpha
 * thresholds. Mounted from `<Home>` only when
 * `process.env.NODE_ENV === 'development'`, so the Leva panel isn't
 * shipped to production. Values flow into `useCurveStore`, which
 * `<TimelineString>` reads each render.
 *
 * After Phase 11 sign-off, the locked-in values can be re-baked as the
 * new defaults in `geometry/curve.ts` and this panel either kept for
 * future tuning or removed.
 */
export function CurveTuner() {
  const setUniforms = useCurveStore((s) => s.setUniforms);

  const tuned = useControls("Edge fade", {
    uAlphaFalloffStart: {
      value: DEFAULT_CURVE_UNIFORMS.uAlphaFalloffStart,
      min: 0,
      max: 1,
      step: 0.01,
      label: "fade start",
    },
    uAlphaFalloffEnd: {
      value: DEFAULT_CURVE_UNIFORMS.uAlphaFalloffEnd,
      min: 0,
      max: 1.5,
      step: 0.01,
      label: "fade end",
    },
  });

  useEffect(() => {
    setUniforms(tuned);
  }, [tuned, setUniforms]);

  return <Leva collapsed={false} />;
}
