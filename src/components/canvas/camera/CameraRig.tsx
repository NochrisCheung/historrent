"use client";

import { OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { TIMELINE_VIEWPORT_WORLD_WIDTH } from "@/shared/constants/timeline";
import { useCameraStore } from "@/state/cameraStore";

/**
 * Orthographic camera. Initial framing: centred on the first event's
 * world-x (plan §1.2 — "first event at middle in the beginning"). The
 * camera position tracks `useCameraStore.cameraX`; Phase 8's wheel +
 * drag handlers call `setCameraX` to pan.
 *
 * Zoom is derived from the canvas pixel width: an ortho camera at zoom Z
 * shows `canvasWidth / Z` world units across the viewport. We pin that to
 * `TIMELINE_VIEWPORT_WORLD_WIDTH`.
 */
export function CameraRig() {
  const width = useThree((state) => state.size.width);
  const cameraX = useCameraStore((s) => s.cameraX);
  const zoom = width / TIMELINE_VIEWPORT_WORLD_WIDTH;

  return (
    <OrthographicCamera makeDefault position={[cameraX, 0, 10]} zoom={zoom} near={0.1} far={100} />
  );
}
