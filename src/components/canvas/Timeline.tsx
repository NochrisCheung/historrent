"use client";

import { Canvas } from "@react-three/fiber";
import { Color } from "three";
import { CameraRig } from "./camera/CameraRig";
import { TimelineString } from "./TimelineString";
import { TimelineItem } from "./TimelineItem";
import { readCssToken } from "@/shared/styles/cssTokens";
import { LiuBangCorpus } from "@/data/liu_bang.schema";
import liuBangData from "@/data/liu_bang.json";

const FALLBACK_BG = "#FBFCFD"; // Matches --canvas-bg in tokens.css.

// Parse the seed at module-load time. Schema violations fail the build's
// integration test (src/data/liu_bang.test.ts) before they ever reach here,
// but parsing here too gives us a typed `corpus` and an extra runtime check.
const corpus = LiuBangCorpus.parse(liuBangData);

/**
 * Phase 1–4 canvas: calibrated camera, pale background, flat timeline
 * string, and one circular item per Liu Bang event. Hover and click flow
 * through the Zustand store; Phase 5 attaches the detail panel.
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
        scene.background = new Color(readCssToken("--canvas-bg", FALLBACK_BG));
      }}
    >
      <CameraRig />
      <TimelineString />
      {corpus.events.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </Canvas>
  );
}
