"use client";

import { Canvas } from "@react-three/fiber";
import { Color } from "three";
import { CameraRig } from "./camera/CameraRig";

const FALLBACK_BG = "#FBFCFD"; // Matches --canvas-bg in tokens.css.

/**
 * Resolves the current value of the CSS variable `--canvas-bg`.
 * Server-safe: returns the fallback when `window` is unavailable.
 */
function readCanvasBackground(): string {
  if (typeof window === "undefined") return FALLBACK_BG;
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue("--canvas-bg")
    .trim();
  return resolved || FALLBACK_BG;
}

/**
 * Phase 1 canvas: an empty stage with the calibrated camera and the
 * pale-grey background. Items, the timeline string, the curve shader, and
 * pan/zoom controls land in subsequent phases.
 *
 * Performance discipline (engineering-practices.md §1.1):
 *  - `frameloop="demand"` — render only when state changes; idle = 0 GPU.
 *  - No always-on animations.
 */
export function Timeline() {
  return (
    <Canvas
      frameloop="demand"
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ scene }) => {
        // Three.js's scene.background needs a real Color, not a CSS-variable
        // string. We read the resolved value once when the canvas is created.
        scene.background = new Color(readCanvasBackground());
      }}
    >
      <CameraRig />
    </Canvas>
  );
}
