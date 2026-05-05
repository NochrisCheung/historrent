/**
 * Camera state — viewport pan position (x) and zoom (Phase 8 will add).
 *
 * The curve uniform `uCurveCenter` mirrors `cameraX` exactly, so the curl
 * always recedes at the viewport edges as the camera pans (plan §1.2:
 * "the curve is a property of the viewport"). `TimelineString` and
 * `TimelineItem` source `cameraX` from this store and pass it to
 * `curveYAt` / the vertex shader as the curve centre.
 *
 * Initial value: world-x of the chronologically first event (Liu Bang's
 * birth). Per Phase 7.5 sign-off (Option A), the first event sits at the
 * viewport's centre at page load; Phase 8 will wire wheel + drag to
 * `setCameraX` so the user can pan to reach later events.
 */

import { create } from "zustand";
import { FIRST_EVENT_WORLD_X } from "@/data/liu_bang";

interface CameraState {
  cameraX: number;
  setCameraX: (x: number) => void;
  reset: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  cameraX: FIRST_EVENT_WORLD_X,
  setCameraX: (cameraX) => set({ cameraX }),
  reset: () => set({ cameraX: FIRST_EVENT_WORLD_X }),
}));

/** Test affordance — same pattern as the other stores. */
declare global {
  interface Window {
    __historrentCameraStore?: typeof useCameraStore;
  }
}
if (typeof window !== "undefined") {
  window.__historrentCameraStore = useCameraStore;
}
