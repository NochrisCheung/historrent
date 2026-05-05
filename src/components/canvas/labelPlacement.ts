/**
 * Lane-based label stagger so always-on event labels don't overlap when
 * events cluster densely on screen (Phase 8.5.10).
 *
 * Algorithm:
 *  1. For each event, compute the rendered (stretched) world-x and from
 *     that the screen-x.
 *  2. Sort events by screen-x.
 *  3. Walk in order. For each event try lane 0; if its screen-x is
 *     within `LABEL_OVERLAP_THRESHOLD_PX` of the most recent occupant
 *     of that lane, try lane+1. Place at the first available lane.
 *
 * The threshold is a heuristic for the widest expected name-label
 * (Chinese, ~5-6 chars at 13 px font ≈ 80–90 px). Lane 0 is the default
 * (label at `BASE_RADIUS × 4` from the dot); higher lanes shift the
 * label outward by `LANE_STEP_PX` per lane.
 */

import { GRANULARITY_WIDTHS } from "@/state/cameraStore";

/** Pixel distance under which two labels are considered to overlap. */
export const LABEL_OVERLAP_THRESHOLD_PX = 90;

export interface LabelPlacementInput {
  id: string;
  /** Original (un-stretched) world-x of the event. */
  originalX: number;
}

/**
 * Returns `{ [eventId]: laneIndex }`. Lane 0 = default; higher lanes get
 * progressively-larger label offsets (computed downstream by the caller).
 */
export function computeLabelLanes(
  events: ReadonlyArray<LabelPlacementInput>,
  cameraX: number,
  viewportWorldWidth: number,
  canvasWidthPx: number,
): Record<string, number> {
  const eventScale = GRANULARITY_WIDTHS.year / viewportWorldWidth;
  const pixelsPerWorld = canvasWidthPx / GRANULARITY_WIDTHS.year;

  const screenXs = events.map((event) => {
    const renderedX = cameraX + (event.originalX - cameraX) * eventScale;
    const screenX = canvasWidthPx / 2 + (renderedX - cameraX) * pixelsPerWorld;
    return { id: event.id, screenX };
  });

  // Sort by screen-x. Stable sort ties on id so the assignment is
  // deterministic for equal positions (e.g. duplicated test fixtures).
  const sorted = [...screenXs].sort((a, b) =>
    a.screenX !== b.screenX ? a.screenX - b.screenX : a.id.localeCompare(b.id),
  );

  /** lane occupancy: index = lane, value = the screen-x of the most recent placement. */
  const laneLastScreenX: number[] = [];
  const lanes: Record<string, number> = {};

  for (const { id, screenX } of sorted) {
    let lane = 0;
    while (
      lane < laneLastScreenX.length &&
      screenX - (laneLastScreenX[lane] ?? -Infinity) < LABEL_OVERLAP_THRESHOLD_PX
    ) {
      lane++;
    }
    laneLastScreenX[lane] = screenX;
    lanes[id] = lane;
  }

  return lanes;
}
