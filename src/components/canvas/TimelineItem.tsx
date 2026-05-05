"use client";

import { Html } from "@react-three/drei";
import { useSpring } from "@react-spring/three";
import { useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Mesh, type MeshBasicMaterial } from "three";
import { useTimelineStore } from "@/state/timelineStore";
import { useUiStore } from "@/state/uiStore";
import { useCurveStore } from "@/state/curveStore";
import { useCameraStore, GRANULARITY_WIDTHS } from "@/state/cameraStore";
import { yearToWorld } from "./geometry/yearToWorld";
import { curveYAt } from "./geometry/curve";
import { centralYear } from "@/shared/date/centralYear";
import { formatYear } from "@/shared/date/bce";
import { readCssToken } from "@/shared/styles/cssTokens";
import { pickName } from "@/shared/text/pickName";
import type { TLiuBangEvent } from "@/data/liu_bang.schema";

const FALLBACK_INK = "#3d3b4f";
const FALLBACK_ACCENT = "#bf242a";

const BASE_RADIUS = 0.04;
const HOVER_SCALE = 1.5; // 0.04 → 0.06 effective radius
const SPRING_CONFIG = { mass: 1, tension: 240, friction: 24 };

/**
 * Per-lane vertical step in CSS pixels. Lane 0 = default position, lane
 * n = `n × LANE_STEP_PX` further from the dot. Sized to clear the
 * label's own height (~16 px) plus a small gap.
 */
const LANE_STEP_PX = 22;

interface TimelineItemProps {
  event: TLiuBangEvent;
  /**
   * Stagger lane assigned by `computeLabelLanes` — 0 = sit at the
   * default position; higher = push the labels (name above, date below)
   * outward in pixel space so adjacent events' labels don't overlap.
   */
  lane: number;
}

/**
 * One event on the timeline: a small circular mesh sitting on the
 * curved string, with DOM-text labels above (name) and below (date).
 *
 * Phase 8.5.9 — events spread radially around `cameraX`. The camera no
 * longer zooms with `viewportWorldWidth`; instead each event renders at
 *   renderedX = cameraX + (originalX − cameraX) × eventScale
 * where `eventScale = GRANULARITY_WIDTHS.year / viewportWorldWidth`.
 * Year zoom = no stretch (eventScale 1); month ≈ 14.6×; day ≈ 292.7×.
 * The string mesh is unchanged, so its curl/wobble shape is identical
 * at every granularity. The y for the dot is `curveYAt(renderedX, …)`,
 * so events near `cameraX` sit on the flat zone and events that have
 * been stretched out into the curl tails ride the curl.
 *
 * Performance discipline (engineering-practices.md §1.1):
 *  - Subscribes to `hoveredId === event.id` via a Zustand selector with
 *    equality semantics — re-renders fire only when *that boolean* flips.
 *  - Hover animation drives `mesh.scale` and the material's `color` via
 *    react-spring/three; `onChange` calls `invalidate()` so the canvas
 *    re-renders for each spring tick — `frameloop="demand"`-compatible.
 *
 * Z-order (plan §4 task 4.5):
 *  - Hovered mesh receives `renderOrder=1` so its dot draws over neighbours.
 */
export function TimelineItem({ event, lane }: TimelineItemProps) {
  const isHovered = useTimelineStore((s) => s.hoveredId === event.id);
  const setHovered = useTimelineStore((s) => s.setHovered);
  const setSelected = useTimelineStore((s) => s.setSelected);
  const language = useUiStore((s) => s.language);

  const invalidate = useThree((s) => s.invalidate);

  const originalX = useMemo(() => yearToWorld(centralYear(event.date)), [event.date]);
  const cameraX = useCameraStore((s) => s.cameraX);
  const viewportWorldWidth = useCameraStore((s) => s.viewportWorldWidth);
  const uCenterFlatHalfWidth = useCurveStore((s) => s.uCenterFlatHalfWidth);
  const uCurveAmount = useCurveStore((s) => s.uCurveAmount);
  const uCurveSharpness = useCurveStore((s) => s.uCurveSharpness);
  const uWobbleAmount = useCurveStore((s) => s.uWobbleAmount);

  const eventScale = GRANULARITY_WIDTHS.year / viewportWorldWidth;
  const renderedX = cameraX + (originalX - cameraX) * eventScale;
  const y = curveYAt(renderedX, {
    uCurveCenter: cameraX,
    uCenterFlatHalfWidth,
    uCurveAmount,
    uCurveSharpness,
    uWobbleAmount,
  });

  const yearLabel = useMemo(
    () => formatYear(centralYear(event.date), language),
    [event.date, language],
  );
  const displayName = useMemo(() => pickName(event.name, language), [event.name, language]);

  const colours = useMemo(
    () => ({
      ink: new Color(readCssToken("--ink", FALLBACK_INK)),
      accent: new Color(readCssToken("--accent", FALLBACK_ACCENT)),
    }),
    [],
  );

  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);

  useSpring({
    scale: isHovered ? HOVER_SCALE : 1,
    mix: isHovered ? 1 : 0,
    config: SPRING_CONFIG,
    onChange: ({ value }) => {
      const scale = value.scale as number;
      const mix = value.mix as number;
      if (meshRef.current) meshRef.current.scale.setScalar(scale);
      if (materialRef.current) {
        materialRef.current.color.copy(colours.ink).lerp(colours.accent, mix);
      }
      invalidate();
    },
  });

  return (
    <group position={[renderedX, y, 0.01]}>
      <mesh
        ref={meshRef}
        renderOrder={isHovered ? 1 : 0}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(event.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          const current = useTimelineStore.getState().hoveredId;
          if (current === event.id) setHovered(null);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(event.id);
        }}
      >
        <circleGeometry args={[BASE_RADIUS, 32]} />
        <meshBasicMaterial ref={materialRef} color={colours.ink} />
      </mesh>

      {/*
        Always-on labels (Phase 8.5.7). Lane stagger (Phase 8.5.10): the
        Html overlay projects to the dot's screen position; we then
        translateY each label by `lane × LANE_STEP_PX` pixels outward
        (name up, date down) so dense clusters separate vertically. A
        thin leader line at lane > 0 connects the label back toward the
        dot so the user can still read which label belongs where.
      */}
      <Html
        position={[0, BASE_RADIUS * 4, 0]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          data-event-name={event.id}
          data-event-lane={lane}
          style={{
            position: "relative",
            transform: `translateY(${-lane * LANE_STEP_PX}px)`,
            fontFamily: "var(--font-content)",
            color: "var(--ink)",
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
          {lane > 0 && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                width: 1,
                height: lane * LANE_STEP_PX,
                background: "var(--ink-muted)",
                opacity: 0.35,
                transform: "translateX(-0.5px)",
              }}
            />
          )}
        </div>
      </Html>

      <Html
        position={[0, -BASE_RADIUS * 4, 0]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          data-event-date={event.id}
          style={{
            position: "relative",
            transform: `translateY(${lane * LANE_STEP_PX}px)`,
            fontFamily: "var(--font-chrome)",
            color: "var(--ink-muted)",
            fontSize: 11,
            whiteSpace: "nowrap",
          }}
        >
          {yearLabel}
          {lane > 0 && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                width: 1,
                height: lane * LANE_STEP_PX,
                background: "var(--ink-muted)",
                opacity: 0.35,
                transform: "translateX(-0.5px)",
              }}
            />
          )}
        </div>
      </Html>
    </group>
  );
}
