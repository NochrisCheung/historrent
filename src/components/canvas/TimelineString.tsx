"use client";

import { useMemo } from "react";
import { Color } from "three";
import { TIMELINE_WORLD_HALF_WIDTH } from "@/shared/constants/timeline";
import { readCssToken } from "@/shared/styles/cssTokens";

const FALLBACK_LINE = "#5d513c"; // Matches --line in tokens.css.

/**
 * Width spans Liu Bang's lifespan in world units (-half … +half).
 * Phase 7 replaces the flat material with a vertex-shader curve that bends
 * the geometry's edges into the "loose string" curl; the geometry itself
 * is reused, so we keep the width pinned to the lifespan range.
 */
const STRING_WIDTH = 2 * TIMELINE_WORLD_HALF_WIDTH;

/**
 * Height is ~1.5% of the lifespan world-x extent — a thin horizontal stripe
 * that reads as a graphite line at the camera's default zoom.
 */
const STRING_HEIGHT = STRING_WIDTH * 0.015;

/**
 * The flat timeline string for Phase 3.
 *
 * Persistence discipline (implementation_plan §4 task 3.2):
 * This component is rendered exactly once from `<Timeline>` and never
 * conditionally. Items mounting / unmounting in later phases must not
 * remount this string — keep the JSX above it stable, and never wrap it
 * in a conditional or list-mapping subtree.
 *
 * Phase 7 replaces the `meshBasicMaterial` with a `shaderMaterial` to
 * apply the curve. The geometry stays; the vertex shader displaces it.
 */
export function TimelineString() {
  const colour = useMemo(() => new Color(readCssToken("--line", FALLBACK_LINE)), []);

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[STRING_WIDTH, STRING_HEIGHT]} />
      <meshBasicMaterial color={colour} />
    </mesh>
  );
}
