"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { Color } from "three";
import { CameraRig } from "./camera/CameraRig";
import { CameraController } from "./camera/CameraController";
import { TimelineString } from "./TimelineString";
import { TimelineItem } from "./TimelineItem";
import { computeLabelLanes } from "./labelPlacement";
import { yearToWorld } from "./geometry/yearToWorld";
import { centralYear } from "@/shared/date/centralYear";
import { readCssToken } from "@/shared/styles/cssTokens";
import { liuBangCorpus } from "@/data/liu_bang";
import { useTimelineStore } from "@/state/timelineStore";
import { useCameraStore } from "@/state/cameraStore";

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
      <EventDots />
    </Canvas>
  );
}

/**
 * Inner component (lives inside `<Canvas>`) so it can read the canvas
 * width via `useThree`. Computes label lanes once per render and passes
 * the lane index to each `<TimelineItem>` (Phase 8.5.10) so always-on
 * labels in dense clusters auto-stagger vertically.
 */
function EventDots() {
  const cameraX = useCameraStore((s) => s.cameraX);
  const viewportWorldWidth = useCameraStore((s) => s.viewportWorldWidth);
  const canvasWidth = useThree((s) => s.size.width);

  const placements = useMemo(
    () =>
      liuBangCorpus.events.map((event) => ({
        id: event.id,
        originalX: yearToWorld(centralYear(event.date)),
      })),
    [],
  );

  const lanes = computeLabelLanes(placements, cameraX, viewportWorldWidth, canvasWidth);

  return (
    <>
      {liuBangCorpus.events.map((event) => (
        <TimelineItem key={event.id} event={event} lane={lanes[event.id] ?? 0} />
      ))}
    </>
  );
}
