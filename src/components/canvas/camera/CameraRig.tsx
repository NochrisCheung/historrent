"use client";

import { OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCameraStore, GRANULARITY_WIDTHS } from "@/state/cameraStore";

/**
 * Orthographic camera bound to `useCameraStore.cameraX` for pan only.
 *
 * Phase 8.5.9: camera zoom is **constant** at `canvas / year-width`.
 * It no longer follows `viewportWorldWidth` — granularity changes are
 * implemented by stretching event positions around `cameraX` in
 * `<TimelineItem>` instead. Side benefit: the string's curl/wobble
 * appearance is identical at every granularity because the camera
 * doesn't zoom over it.
 *
 * Pan still tracks `cameraX` so dragging slides the visible portion of
 * the (fixed) string left/right.
 */
export function CameraRig() {
  const canvasWidth = useThree((state) => state.size.width);
  const cameraX = useCameraStore((s) => s.cameraX);
  const zoom = canvasWidth / GRANULARITY_WIDTHS.year;

  return (
    <OrthographicCamera makeDefault position={[cameraX, 0, 10]} zoom={zoom} near={0.1} far={100} />
  );
}
