"use client";

import { Html } from "@react-three/drei";
import { useSpring } from "@react-spring/three";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
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

interface TimelineItemProps {
  event: TLiuBangEvent;
}

/**
 * One event on the timeline: a small circular mesh sitting just above the
 * string, with DOM-text labels above (name) and below (date).
 *
 * Pixel-stable size (Phase 8.5.1): the dot's world radius is fixed but
 * Three.js ortho zoom (= canvas / viewport) blows it up at month/day
 * zoom. We multiply the mesh's scale by `viewportWorldWidth /
 * GRANULARITY_WIDTHS.year` to cancel the camera factor — dot stays ~5px
 * across at every zoom. The same factor scales the `<Html>` y-offsets
 * so the labels keep their pixel-pinned distance from the dot.
 *
 * The hover spring also drives a 1.0 → 1.5 multiplier on the mesh.
 * Both animation sources (hover + viewport) share `setScalar` via two
 * refs (`hoverScaleRef`, `viewportScaleRef`); each writer multiplies
 * them together, so the two animations compose without stale-closure
 * races. Group wrapper carries the world position so the inner mesh's
 * scale doesn't drag the sibling `<Html>` overlays into a pinhole.
 *
 * Performance discipline (engineering-practices.md §1.1):
 *  - Subscribes to `hoveredId === event.id` via a Zustand selector with
 *    equality semantics — re-renders fire only when *that boolean* flips.
 *  - Hover animation calls `invalidate()` so the canvas re-renders for
 *    each spring tick — compatible with `frameloop="demand"`.
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
  // the item only re-positions when the curve uniforms change.
  const uCurveCenter = useCameraStore((s) => s.cameraX);
  const viewportWorldWidth = useCameraStore((s) => s.viewportWorldWidth);
  const uCenterFlatHalfWidth = useCurveStore((s) => s.uCenterFlatHalfWidth);
  const uCurveAmount = useCurveStore((s) => s.uCurveAmount);
  const uCurveSharpness = useCurveStore((s) => s.uCurveSharpness);
  const uWobbleAmount = useCurveStore((s) => s.uWobbleAmount);
  const y = curveYAt(x, {
    uCurveCenter,
    uCenterFlatHalfWidth,
    uCurveAmount,
    uCurveSharpness,
    uWobbleAmount,
  });
  const viewportScale = viewportWorldWidth / GRANULARITY_WIDTHS.year;
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
  // The hover spring drives `hoverScaleRef`; viewport changes drive
  // `viewportScaleRef`. Each writer multiplies them when calling
  // `setScalar`, so both sources compose without stale-closure races.
  const hoverScaleRef = useRef(1);
  const viewportScaleRef = useRef(viewportScale);

  useEffect(() => {
    viewportScaleRef.current = viewportScale;
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hoverScaleRef.current * viewportScale);
    }
    invalidate();
  }, [viewportScale, invalidate]);

  useSpring({
    scale: isHovered ? HOVER_SCALE : 1,
    mix: isHovered ? 1 : 0,
    config: SPRING_CONFIG,
    onChange: ({ value }) => {
      const scale = value.scale as number;
      const mix = value.mix as number;
      hoverScaleRef.current = scale;
      if (meshRef.current) {
        meshRef.current.scale.setScalar(scale * viewportScaleRef.current);
      }
      if (materialRef.current) {
        materialRef.current.color.copy(colours.ink).lerp(colours.accent, mix);
      }
      invalidate(); // Schedule one frame; idle when the spring settles.
    },
  });

  // Pixel-pinned label distance from dot. The Html overlays project from
  // world-space to screen, so multiplying their world y-offset by
  // viewportScale keeps the screen distance constant across zooms.
  const labelOffset = BASE_RADIUS * 4 * viewportScale;

  return (
    <group position={[x, y, 0.01]}>
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
        Labels are hidden at rest and revealed on hover.
        At year-zoom Liu Bang's middle four events cluster within ~0.3 world
        units (a few dozen pixels) so always-on labels overlap. Per
        engineering-practices.md §1.1.5 ("Label de-clustering at scale") we
        drop them by default and let hover reveal one at a time. Phase 8's
        zoom levels and Phase 1.5's significance filter restore some
        always-on visibility. Labels are siblings (not children) of the dot
        mesh so the mesh's scale doesn't pull the labels into a pinhole at
        month/day zoom (Phase 8.5.1).
      */}
      {/* Event name — above the dot. */}
      <Html
        position={[0, labelOffset, 0]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          data-event-name={event.id}
          style={{
            fontFamily: "var(--font-content)",
            color: "var(--ink)",
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
            opacity: isHovered ? 1 : 0,
            transition: "opacity var(--dur-fast) var(--ease)",
          }}
        >
          {displayName}
        </div>
      </Html>

      {/* Date — below the dot. */}
      <Html
        position={[0, -labelOffset, 0]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          data-event-date={event.id}
          style={{
            fontFamily: "var(--font-chrome)",
            color: "var(--ink-muted)",
            fontSize: 11,
            whiteSpace: "nowrap",
            opacity: isHovered ? 1 : 0,
            transition: "opacity var(--dur-fast) var(--ease)",
          }}
        >
          {yearLabel}
        </div>
      </Html>
    </group>
  );
}
