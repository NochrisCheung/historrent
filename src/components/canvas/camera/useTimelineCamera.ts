"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { useCameraStore, snapToGranularity, GRANULARITY_WIDTHS } from "@/state/cameraStore";
import {
  applyWheelZoom,
  cameraXToKeepWorldAt,
  dragDeltaToWorldX,
  screenXToWorldX,
} from "./cameraMath";

/**
 * Pan/zoom controller for the timeline canvas (plan Phase 8).
 *
 *  - Wheel ctrlKey OR vertical-dominant wheel: cursor-anchored zoom. The
 *    world-x under the cursor stays pinned through the zoom step so the
 *    user can "scroll into" a region.
 *  - Wheel horizontally (trackpad two-finger swipe — `|deltaX| > |deltaY|`):
 *    pan camera-x by the delta.
 *  - Left-mouse drag (anywhere on the page): pan camera-x. We don't filter
 *    by event target — the canvas fills the viewport and a click-without-
 *    movement leaves cameraX unchanged, so R3F's pointer handlers continue
 *    to resolve event-dot selection cleanly.
 *  - 220ms after the last wheel tick, we snap `granularity` to whichever
 *    of {year, month, day} is closest in log-space. The
 *    `<CameraController>` watches `granularity` and springs the
 *    `viewportWorldWidth` to the snapped width.
 *
 * Performance notes:
 *  - Wheel listener uses `{ passive: false }` so we can `preventDefault`
 *    and stop the page from scrolling during canvas interaction.
 *  - We mutate the store directly each event — the store subscription on
 *    `<CameraRig>` and `<TimelineString>` triggers an R3F invalidation, so
 *    `frameloop="demand"` still applies.
 *  - Mouse listeners attach to `window` rather than the canvas because R3F
 *    installs its own `pointerdown`/`pointermove` listeners on the canvas
 *    and may stop propagation; window-level events still fire reliably.
 */

const ZOOM_SENSITIVITY = 0.0015; // exponential factor per wheel-deltaY pixel
const SNAP_DEBOUNCE_MS = 220;
const HORIZONTAL_PAN_RATIO = 1.2; // |deltaX| must exceed this × |deltaY| to pan instead of zoom

const MIN_VIEWPORT_WORLD_WIDTH = GRANULARITY_WIDTHS.day * 0.5;
const MAX_VIEWPORT_WORLD_WIDTH = GRANULARITY_WIDTHS.year * 2;

export function useTimelineCamera() {
  const canvas = useThree((s) => s.gl.domElement);
  const canvasWidth = useThree((s) => s.size.width);

  const canvasWidthRef = useRef(canvasWidth);
  useEffect(() => {
    canvasWidthRef.current = canvasWidth;
  }, [canvasWidth]);

  useEffect(() => {
    if (!canvas) return;

    let snapTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleSnap = () => {
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const { viewportWorldWidth, granularity, setGranularity } = useCameraStore.getState();
        const next = snapToGranularity(viewportWorldWidth);
        if (next !== granularity) setGranularity(next);
      }, SNAP_DEBOUNCE_MS);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const width = canvasWidthRef.current;

      const { cameraX, viewportWorldWidth, setCameraX, setViewportWorldWidth } =
        useCameraStore.getState();

      const horizontalPan =
        !event.ctrlKey && Math.abs(event.deltaX) > Math.abs(event.deltaY) * HORIZONTAL_PAN_RATIO;

      if (horizontalPan) {
        const deltaWorld = (event.deltaX / width) * viewportWorldWidth;
        setCameraX(cameraX + deltaWorld);
        return;
      }

      // Cursor-anchored zoom: pin the world-x under the cursor.
      const worldUnderCursor = screenXToWorldX(screenX, width, cameraX, viewportWorldWidth);
      const nextWidth = applyWheelZoom(
        viewportWorldWidth,
        event.deltaY,
        ZOOM_SENSITIVITY,
        MIN_VIEWPORT_WORLD_WIDTH,
        MAX_VIEWPORT_WORLD_WIDTH,
      );
      if (nextWidth === viewportWorldWidth) return;
      const nextCameraX = cameraXToKeepWorldAt(worldUnderCursor, screenX, width, nextWidth);
      setViewportWorldWidth(nextWidth);
      setCameraX(nextCameraX);
      scheduleSnap();
    };

    let dragging = false;
    let lastClientX = 0;

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      // Arm drag-pan on any primary-button mousedown anywhere on the
      // page. The canvas fills the viewport; the only fixed-position UI
      // elements (toggles, panel) handle their own clicks. A
      // click-without-movement leaves cameraX unchanged, so R3F's pointer
      // handlers still resolve event-dot selection cleanly.
      dragging = true;
      lastClientX = event.clientX;
      document.body.style.cursor = "grabbing";
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!dragging) return;
      const deltaScreenX = event.clientX - lastClientX;
      lastClientX = event.clientX;
      if (deltaScreenX === 0) return;
      const { cameraX, viewportWorldWidth, setCameraX } = useCameraStore.getState();
      const deltaWorld = dragDeltaToWorldX(
        deltaScreenX,
        canvasWidthRef.current,
        viewportWorldWidth,
      );
      setCameraX(cameraX + deltaWorld);
    };

    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.cursor = "";
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      if (snapTimer) clearTimeout(snapTimer);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [canvas]);
}
