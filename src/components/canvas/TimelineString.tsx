"use client";

import { useMemo } from "react";
import { Color } from "three";
import { TIMELINE_WORLD_HALF_WIDTH } from "@/shared/constants/timeline";
import { readCssToken } from "@/shared/styles/cssTokens";
import { useCurveStore } from "@/state/curveStore";
import { curveVertexShader, curveFragmentShader, DEFAULT_FRAGMENT_UNIFORMS } from "./shaders";

const FALLBACK_LINE = "#5d513c"; // matches --line in tokens.css.
const STRING_WIDTH = 2 * TIMELINE_WORLD_HALF_WIDTH;
const STRING_HEIGHT = STRING_WIDTH * 0.015;

/**
 * The curved-string timeline.
 *
 * Geometry: a flat plane subdivided into 64 width segments so the vertex
 * shader has enough vertices to interpolate the curl smoothly.
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
  const uCenterFlatHalfWidth = useCurveStore((s) => s.uCenterFlatHalfWidth);
  const uCurveAmount = useCurveStore((s) => s.uCurveAmount);
  const uCurveSharpness = useCurveStore((s) => s.uCurveSharpness);

  const lineColour = useMemo(() => new Color(readCssToken("--line", FALLBACK_LINE)), []);

  // A fresh uniforms object per render keeps the shader values in sync with
  // the store. `lineColour`, `vertexShader`, and `fragmentShader` are stable
  // so Three.js doesn't recompile.
  const uniforms = {
    uCenterFlatHalfWidth: { value: uCenterFlatHalfWidth },
    uCurveAmount: { value: uCurveAmount },
    uCurveSharpness: { value: uCurveSharpness },
    uColor: { value: lineColour },
    uAlphaFalloffStart: { value: DEFAULT_FRAGMENT_UNIFORMS.alphaFalloffStart },
    uAlphaFalloffEnd: { value: DEFAULT_FRAGMENT_UNIFORMS.alphaFalloffEnd },
  };

  return (
    <mesh position={[0, 0, 0]} renderOrder={0}>
      <planeGeometry args={[STRING_WIDTH, STRING_HEIGHT, 64, 1]} />
      <shaderMaterial
        vertexShader={curveVertexShader}
        fragmentShader={curveFragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}
