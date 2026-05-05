"use client";

import { Html } from "@react-three/drei";
import { useSpring } from "@react-spring/three";
import { useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Mesh, type MeshBasicMaterial } from "three";
import { useTimelineStore } from "@/state/timelineStore";
import { useUiStore } from "@/state/uiStore";
import { useCurveStore } from "@/state/curveStore";
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

interface TimelineItemProps {
  event: TLiuBangEvent;
}

/**
 * One event on the timeline: a small circular mesh sitting just above the
 * string, with a DOM-text label below.
 *
 * Performance discipline (engineering-practices.md §1.1):
 *  - Subscribes to `hoveredId === event.id` via a Zustand selector with
 *    equality semantics — re-renders fire only when *that boolean* flips.
 *  - Hover animation drives `mesh.scale` and the material's `color` via
 *    react-spring/three. The spring's `onChange` writes spring values into
 *    refs and calls `invalidate()` so the canvas re-renders for each spring
 *    tick — compatible with `frameloop="demand"` (no always-on render loop).
 *  - We use plain `<mesh>` (not `animated.mesh`) because some
 *    `@react-spring/three` versions miss `onPointerOver/Out/Click` events
 *    when the mesh is wrapped.
 *
 * Z-order (plan §4 task 4.5):
 *  - Hovered mesh receives `renderOrder=1` so its dot draws over neighbours.
 *  - The label's `<Html>` overlay raises its `zIndex` so it stacks above
 *    other labels in the DOM.
 */
export function TimelineItem({ event }: TimelineItemProps) {
  const isHovered = useTimelineStore((s) => s.hoveredId === event.id);
  const setHovered = useTimelineStore((s) => s.setHovered);
  const setSelected = useTimelineStore((s) => s.setSelected);
  const language = useUiStore((s) => s.language);

  const invalidate = useThree((s) => s.invalidate);

  const x = useMemo(() => yearToWorld(centralYear(event.date)), [event.date]);
  // Item rides the curve at its world-x. Selectors keep re-renders narrow:
  // the item only re-mounts/re-positions when the curve uniforms change.
  const uCenterFlatHalfWidth = useCurveStore((s) => s.uCenterFlatHalfWidth);
  const uCurveAmount = useCurveStore((s) => s.uCurveAmount);
  const uCurveSharpness = useCurveStore((s) => s.uCurveSharpness);
  const y = curveYAt(x, { uCenterFlatHalfWidth, uCurveAmount, uCurveSharpness });
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
      invalidate(); // Schedule one frame; idle when the spring settles.
    },
  });

  return (
    <mesh
      ref={meshRef}
      position={[x, y, 0.01]}
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

      <Html
        position={[0, -BASE_RADIUS * 4, 0]}
        center
        zIndexRange={[20, 0]}
        style={{
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          data-event-label={event.id}
          style={{
            fontFamily: "var(--font-content)",
            color: "var(--ink)",
            fontSize: 12,
            whiteSpace: "nowrap",
            opacity: isHovered ? 1 : 0.75,
            transition: "opacity var(--dur-fast) var(--ease)",
          }}
        >
          {displayName}
          <span style={{ color: "var(--ink-muted)", marginLeft: 6, fontSize: 11 }}>
            {yearLabel}
          </span>
        </div>
      </Html>
    </mesh>
  );
}
