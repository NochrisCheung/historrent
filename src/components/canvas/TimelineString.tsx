"use client";

import { useMemo } from "react";
import { Color } from "three";
import { TIMELINE_STRING_HALF_EXTENT } from "@/shared/constants/timeline";
import { readCssToken } from "@/shared/styles/cssTokens";
import { useCurveStore } from "@/state/curveStore";
import { useCameraStore } from "@/state/cameraStore";
import { VIEWPORT_HALF_WIDTH } from "./geometry/curve";
import { curveVertexShader, curveFragmentShader } from "./shaders";

const FALLBACK_LINE = "#5d513c"; // matches --line in tokens.css.

/**
 * The string mesh extends well past the lifespan in both directions so
 * the user can pan freely without ever seeing the mesh end. The
 * fragment shader's viewport-relative alpha falloff (Phase 8.5.11) is
 * what fades the visible left/right ends, regardless of the mesh's
 * world-x extent. Width = 2 × TIMELINE_STRING_HALF_EXTENT.
 */
const STRING_WIDTH = 2 * TIMELINE_STRING_HALF_EXTENT;

/**
 * Thin string. Reads as a clean ~2 px line at the camera's constant
 * zoom (canvas / year-width) on a typical desktop.
 */
const STRING_HEIGHT = 0.02;

/**
 * Plane subdivisions along x. After Phase 8.5.11 the vertex shader no
 * longer displaces y, so heavy subdivision isn't strictly required for
 * smoothness; we keep a moderate count so the fragment shader has
 * enough samples for a clean alpha gradient across the line.
 */
const STRING_SEGMENTS_X = 64;

/**
 * The flat timeline string with viewport-relative edge fade.
 *
 * Reactivity: uniforms are sourced from `useCurveStore` (alpha-falloff
 * thresholds) and `useCameraStore.cameraX` (the fade pivot) each
 * render. When any of these change, R3F reconciles the new uniforms
 * object onto the material and Three.js draws once. This is
 * `frameloop="demand"`-safe because the React re-render is the source
 * of the invalidation.
 *
 * Persistence (plan §4 task 3.2): rendered exactly once from
 * `<Timeline>`, never conditionally. Item mounts/unmounts must not
 * remount this string.
 */
export function TimelineString() {
  const uCurveCenter = useCameraStore((s) => s.cameraX);
  const uAlphaFalloffStart = useCurveStore((s) => s.uAlphaFalloffStart);
  const uAlphaFalloffEnd = useCurveStore((s) => s.uAlphaFalloffEnd);

  const lineColour = useMemo(() => new Color(readCssToken("--line", FALLBACK_LINE)), []);

  const uniforms = {
    uCurveCenter: { value: uCurveCenter },
    uViewportHalfWidth: { value: VIEWPORT_HALF_WIDTH },
    uAlphaFalloffStart: { value: uAlphaFalloffStart },
    uAlphaFalloffEnd: { value: uAlphaFalloffEnd },
    uColor: { value: lineColour },
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
