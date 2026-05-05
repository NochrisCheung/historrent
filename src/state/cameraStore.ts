/**
 * Camera state — viewport pan position (x), continuous zoom width, and
 * the discrete granularity (year / month / day) the user has selected.
 *
 * The curve uniform `uCurveCenter` mirrors `cameraX` exactly, so the curl
 * always recedes at the viewport edges as the camera pans (plan §1.2:
 * "the curve is a property of the viewport"). `TimelineString` and
 * `TimelineItem` source `cameraX` from this store and pass it to
 * `curveYAt` / the vertex shader.
 *
 * `viewportWorldWidth` is the canonical "zoom" — the world-x extent
 * visible across the canvas. Smaller = more zoomed in. CameraRig derives
 * the Three.js ortho-camera zoom from it.
 *
 * `granularity` is the snapped zoom level. Wheel zoom updates
 * `viewportWorldWidth` continuously; after the wheel stops, we snap to
 * the nearest granularity. Toggle clicks set granularity directly and a
 * react-spring animates `viewportWorldWidth` to the matching value.
 *
 * Initial value: pan centred on Liu Bang's birth, year-level zoom.
 */

import { create } from "zustand";
import { FIRST_EVENT_WORLD_X } from "@/data/liu_bang";
import { TIMELINE_VIEWPORT_WORLD_WIDTH } from "@/shared/constants/timeline";

export type Granularity = "year" | "month" | "day";

/**
 * World-x extent visible at each snapped granularity.
 *
 * Liu Bang's lifespan is 61 years mapped to 10 world units (1 year ≈ 0.164
 * world units). Year-zoom shows the lifespan plus margin; month-zoom shows
 * ~5 years; day-zoom shows ~3 months.
 */
export const GRANULARITY_WIDTHS: Record<Granularity, number> = {
  year: TIMELINE_VIEWPORT_WORLD_WIDTH,
  month: 0.82,
  day: 0.041,
};

interface CameraState {
  cameraX: number;
  viewportWorldWidth: number;
  granularity: Granularity;
}

interface CameraActions {
  setCameraX: (x: number) => void;
  setViewportWorldWidth: (width: number) => void;
  setGranularity: (g: Granularity) => void;
  reset: () => void;
}

const INITIAL_STATE: CameraState = {
  cameraX: FIRST_EVENT_WORLD_X,
  viewportWorldWidth: GRANULARITY_WIDTHS.year,
  granularity: "year",
};

export const useCameraStore = create<CameraState & CameraActions>((set) => ({
  ...INITIAL_STATE,
  setCameraX: (cameraX) => set({ cameraX }),
  setViewportWorldWidth: (viewportWorldWidth) => set({ viewportWorldWidth }),
  setGranularity: (granularity) => set({ granularity }),
  reset: () => set(INITIAL_STATE),
}));

/**
 * Snap a free-form viewportWorldWidth to the nearest granularity (in log
 * space, since the widths span ~3 orders of magnitude). Used after wheel
 * zoom stops.
 */
export function snapToGranularity(viewportWorldWidth: number): Granularity {
  const log = Math.log(viewportWorldWidth);
  let best: Granularity = "year";
  let bestDist = Infinity;
  for (const g of ["year", "month", "day"] as const) {
    const d = Math.abs(Math.log(GRANULARITY_WIDTHS[g]) - log);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

/** Test affordance — same pattern as the other stores. */
declare global {
  interface Window {
    __historrentCameraStore?: typeof useCameraStore;
  }
}
if (typeof window !== "undefined") {
  window.__historrentCameraStore = useCameraStore;
}
