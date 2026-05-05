"use client";

import { OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCameraStore } from "@/state/cameraStore";

/**
 * Orthographic camera bound to `useCameraStore`. Both pan (`cameraX`) and
 * zoom (`viewportWorldWidth`) react to store changes:
 *  - User wheel + drag handlers (Phase 8 `useTimelineCamera`) write store
 *    values directly for immediate response.
 *  - Granularity transitions (toggle click, wheel-stop snap) animate
 *    `viewportWorldWidth` via the spring in `<CameraController>`.
 *
 * Three.js zoom = canvas pixel width / viewportWorldWidth. Smaller world
 * width = larger zoom value = more zoomed in.
 */
export function CameraRig() {
  const canvasWidth = useThree((state) => state.size.width);
  const cameraX = useCameraStore((s) => s.cameraX);
  const viewportWorldWidth = useCameraStore((s) => s.viewportWorldWidth);
  const zoom = canvasWidth / viewportWorldWidth;

  return (
    <OrthographicCamera makeDefault position={[cameraX, 0, 10]} zoom={zoom} near={0.1} far={100} />
  );
}
