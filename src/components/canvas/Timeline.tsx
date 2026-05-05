"use client";

import { Canvas } from "@react-three/fiber";
import { Color } from "three";
import { CameraRig } from "./camera/CameraRig";
import { TimelineString } from "./TimelineString";
import { readCssToken } from "@/shared/styles/cssTokens";

const FALLBACK_BG = "#FBFCFD"; // Matches --canvas-bg in tokens.css.

/**
 * Phase 1–3 canvas: the calibrated stage, pale background, and the flat
 * timeline string. Items, curve shader, and pan/zoom controls land in
 * later phases.
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
        scene.background = new Color(readCssToken("--canvas-bg", FALLBACK_BG));
      }}
    >
      <CameraRig />
      <TimelineString />
    </Canvas>
  );
}
