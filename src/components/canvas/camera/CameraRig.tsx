"use client";

import { OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { TIMELINE_VIEWPORT_WORLD_WIDTH } from "@/shared/constants/timeline";

/**
 * Orthographic camera calibrated so Liu Bang's whole life fits the viewport
 * with a small margin (see `TIMELINE_VIEWPORT_WORLD_WIDTH`).
 *
 * Zoom is derived from the canvas pixel width: an ortho camera at zoom Z shows
 * `canvasWidth / Z` world units across the viewport. We pin that to our
 * desired world width.
 *
 * Pan / zoom interaction (Phase 8) will replace this static zoom with a
 * controller; this rig is just the default frame.
 */
export function CameraRig() {
  const width = useThree((state) => state.size.width);
  const zoom = width / TIMELINE_VIEWPORT_WORLD_WIDTH;

  return <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={zoom} near={0.1} far={100} />;
}
