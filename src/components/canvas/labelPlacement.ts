/**
 * Lane-based label stagger so always-on event labels don't overlap when
 * events cluster densely on screen (Phase 8.5.10, refined in 8.5.13).
 *
 * Algorithm (cluster-based, after 8.5.13):
 *  1. Compute each event's screen-x.
 *  2. Sort events left-to-right.
 *  3. Detect "clusters" by adjacent-gap: a cluster is a maximal run of
 *     events where neighbour gap is `< LABEL_OVERLAP_THRESHOLD_PX`.
 *     Events separated by ≥ threshold start a new cluster.
 *  4. For each cluster:
 *      a. Place the **leftmost** event at the lowest available lane
 *         (anchors the left side of the cluster at the line).
 *      b. Process the remaining cluster events **right-to-left**, each
 *         at the lowest available lane (anchors the right side too —
 *         the rightmost event of the cluster gets lane 0 when its
 *         distance to the leftmost allows).
 *  5. Lane 0 is shared globally across clusters: events in different
 *     clusters are by definition outside each other's threshold so
 *     they don't collide on lane 0.
 *
 * For a tight 3-event clique inside a cluster, this yields the arch
 * `{leftmost: 0, middle: 2, rightmost: 1}` — both ends near the line,
 * peak in the middle. For a wholly-isolated event (own cluster of one)
 * the loop reduces to the trivial "place at lane 0".
 *
 * **Limitation:** for an N-event clique with N ≥ 4, the algorithm
 * degrades to a descending staircase from the cluster's interior —
 * N mutually-conflicting labels can't fit a balanced arch. This is a
 * coloring lower-bound, not a heuristic limit.
 *
 * The threshold is a heuristic for the widest expected name-label
 * (Chinese, ~5–6 chars at 13 px font ≈ 80–90 px). Lane 0 = label sits
 * at the default `BASE_RADIUS × 4` distance from the dot; higher lanes
 * shift the label outward by `LANE_STEP_PX` per lane.
 */

import { GRANULARITY_WIDTHS } from "@/state/cameraStore";

/** Pixel distance under which two labels are considered to overlap. */
export const LABEL_OVERLAP_THRESHOLD_PX = 90;

export interface LabelPlacementInput {
  id: string;
  /** Original (un-stretched) world-x of the event. */
  originalX: number;
}

interface PlacedEvent {
  id: string;
  screenX: number;
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

  const screenXs: PlacedEvent[] = events.map((event) => {
    const renderedX = cameraX + (event.originalX - cameraX) * eventScale;
    const screenX = canvasWidthPx / 2 + (renderedX - cameraX) * pixelsPerWorld;
    return { id: event.id, screenX };
  });

  // Sort left-to-right (ascending screen-x); stable id tiebreak.
  const sorted = [...screenXs].sort((a, b) =>
    a.screenX !== b.screenX ? a.screenX - b.screenX : a.id.localeCompare(b.id),
  );

  // Detect clusters by adjacent gap.
  const clusters: PlacedEvent[][] = [];
  for (const event of sorted) {
    const last = clusters[clusters.length - 1];
    const lastEvent = last?.[last.length - 1];
    if (last && lastEvent && event.screenX - lastEvent.screenX < LABEL_OVERLAP_THRESHOLD_PX) {
      last.push(event);
    } else {
      clusters.push([event]);
    }
  }

  // Global lane occupancy: each lane stores the events placed on it.
  const laneEvents: PlacedEvent[][] = [];
  const lanes: Record<string, number> = {};

  const placeAtLowestLane = (event: PlacedEvent) => {
    let lane = 0;
    while (lane < laneEvents.length) {
      const occupants = laneEvents[lane] ?? [];
      const conflicts = occupants.some(
        (placed) => Math.abs(placed.screenX - event.screenX) < LABEL_OVERLAP_THRESHOLD_PX,
      );
      if (!conflicts) break;
      lane++;
    }
    const bucket = laneEvents[lane] ?? (laneEvents[lane] = []);
    bucket.push(event);
    lanes[event.id] = lane;
  };

  // For each cluster: leftmost first (anchors the left), then the rest
  // right-to-left (the rightmost gets the next lowest free lane,
  // anchoring the right side close to its outside neighbour).
  for (const cluster of clusters) {
    const first = cluster[0];
    if (!first) continue;
    placeAtLowestLane(first);
    for (let i = cluster.length - 1; i >= 1; i--) {
      const event = cluster[i];
      if (event) placeAtLowestLane(event);
    }
  }

  return lanes;
}
