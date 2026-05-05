"use client";

import { useMemo } from "react";
import { Color } from "three";
import { TIMELINE_STRING_HALF_EXTENT } from "@/shared/constants/timeline";
import { readCssToken } from "@/shared/styles/cssTokens";
import { useCurveStore } from "@/state/curveStore";
import { useCameraStore } from "@/state/cameraStore";
import { curveVertexShader, curveFragmentShader, DEFAULT_FRAGMENT_UNIFORMS } from "./shaders";

const FALLBACK_LINE = "#5d513c"; // matches --line in tokens.css.

/**
 * The string mesh extends well past the lifespan in both directions so the
 * scarf-like curl/wave have room to develop into the off-viewport past and
 * future. Width = 2 × TIMELINE_STRING_HALF_EXTENT.
 */
const STRING_WIDTH = 2 * TIMELINE_STRING_HALF_EXTENT;

/**
 * Thin string. Reads as a clean ~2 px line at the camera's constant
 * zoom (canvas/year-width) on a typical desktop. After Phase 8.5.9 the
 * camera no longer zooms with granularity, so no y-scale compensation
 * is needed — this constant alone drives the on-screen thickness.
 */
const STRING_HEIGHT = 0.02;

/**
 * Plane subdivisions along x. The vertex shader interpolates the wave/curl
 * across these vertices, so we need enough density to keep the long string
 * smooth without visible faceting at the curl tails.
 */
const STRING_SEGMENTS_X = 256;

/**
 * The curved-string timeline.
 *
 * Reactivity: uniforms are sourced from `useCurveStore` each render. When
 * the store changes (Leva-driven during dev, locked in production) the
 * component re-renders, R3F reconciles the new uniforms object onto the
 * material, and Three.js draws once. This is `frameloop="demand"`-safe
 * because the React re-render is the source of the invalidation.
 *
 * Persistence (plan §4 task 3.2): rendered exactly once from `<Timeline>`,
 * never conditionally. Item mounts/unmounts must not remount this string.
 */
export function TimelineString() {
  // Curve centre mirrors the camera so the curl always recedes at the
  // viewport edges as the user pans (Phase 8). The visible portion of
  // the string is always `cameraX ± year-width/2` because Phase 8.5.9
  // pinned the camera zoom; the curl/wave proportions are therefore
  // identical at every granularity.
  const uCurveCenter = useCameraStore((s) => s.cameraX);
  const uCenterFlatHalfWidth = useCurveStore((s) => s.uCenterFlatHalfWidth);
  const uCurveAmount = useCurveStore((s) => s.uCurveAmount);
  const uCurveSharpness = useCurveStore((s) => s.uCurveSharpness);
  const uWobbleAmount = useCurveStore((s) => s.uWobbleAmount);

  const lineColour = useMemo(() => new Color(readCssToken("--line", FALLBACK_LINE)), []);

  const uniforms = {
    uCurveCenter: { value: uCurveCenter },
    uCenterFlatHalfWidth: { value: uCenterFlatHalfWidth },
    uCurveAmount: { value: uCurveAmount },
    uCurveSharpness: { value: uCurveSharpness },
    uWobbleAmount: { value: uWobbleAmount },
    uColor: { value: lineColour },
    uAlphaFalloffStart: { value: DEFAULT_FRAGMENT_UNIFORMS.alphaFalloffStart },
    uAlphaFalloffEnd: { value: DEFAULT_FRAGMENT_UNIFORMS.alphaFalloffEnd },
  };

  return (
    <mesh position={[0, 0, 0]} renderOrder={0}>
      <planeGeometry args={[STRING_WIDTH, STRING_HEIGHT, STRING_SEGMENTS_X, 1]} />
      <shaderMaterial
        vertexShader={curveVertexShader}
        fragmentShader={curveFragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}
