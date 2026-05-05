"use client";

import { Canvas } from "@react-three/fiber";
import { Color } from "three";
import { CameraRig } from "./camera/CameraRig";
import { CameraController } from "./camera/CameraController";
import { TimelineString } from "./TimelineString";
import { TimelineItem } from "./TimelineItem";
import { readCssToken } from "@/shared/styles/cssTokens";
import { liuBangCorpus } from "@/data/liu_bang";
import { useTimelineStore } from "@/state/timelineStore";

const FALLBACK_BG = "#FBFCFD"; // Matches --canvas-bg in tokens.css.

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
  const setSelected = useTimelineStore((s) => s.setSelected);

  return (
    <Canvas
      frameloop="demand"
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ scene }) => {
        scene.background = new Color(readCssToken("--canvas-bg", FALLBACK_BG));
      }}
      // Click on empty canvas (no mesh hit) clears the current selection.
      // Mesh clicks call e.stopPropagation() so they never trigger this path.
      onPointerMissed={() => setSelected(null)}
    >
      <CameraRig />
      <CameraController />
      <TimelineString />
      {liuBangCorpus.events.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </Canvas>
  );
}
