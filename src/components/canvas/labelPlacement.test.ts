import { describe, it, expect } from "vitest";
import { computeLabelLanes, LABEL_OVERLAP_THRESHOLD_PX } from "./labelPlacement";
import { GRANULARITY_WIDTHS } from "@/state/cameraStore";

const CANVAS = 1280;

describe("computeLabelLanes", () => {
  it("places widely-spaced events all on lane 0", () => {
    // Spread 3 events across the year-zoom viewport (12 wu wide). Their
    // screen-x positions are ~640, ~213, ~1067 — all >> threshold apart.
    const events = [
      { id: "a", originalX: -4 },
      { id: "b", originalX: 0 },
      { id: "c", originalX: 4 },
    ];
    const lanes = computeLabelLanes(events, 0, GRANULARITY_WIDTHS.year, CANVAS);
    expect(lanes).toEqual({ a: 0, b: 0, c: 0 });
  });

  it("promotes overlapping events to higher lanes and recycles lane 0 when distance allows", () => {
    // 4 events at year zoom. Pixel positions (CANVAS=1280, viewport=12):
    // a@-0.5 → 586.7, b@-0.166 → 622.3, c@+0.166 → 657.7, d@+0.5 → 693.3.
    // All adjacent gaps are ~35 px (< threshold 90) so {a, b, c, d} is
    // one cluster (Phase 8.5.13). Cluster walk: leftmost (a) first,
    // then rest right-to-left (d, c, b):
    //   a → lane 0
    //   d → lane 0 (107 px from a, past threshold)
    //   c → lane 1 (35.6 from d on 0; 71 from a on 0 — conflict)
    //   b → lane 2 (35.6 from a on 0; 35.4 from c on 1 — conflict)
    // Reading left-to-right the assignment is the arch {0, 2, 1, 0} —
    // both ends low, peak at b in the middle.
    const events = [
      { id: "a", originalX: -0.5 },
      { id: "b", originalX: -0.166 },
      { id: "c", originalX: 0.166 },
      { id: "d", originalX: 0.5 },
    ];
    const lanes = computeLabelLanes(events, 0, GRANULARITY_WIDTHS.year, CANVAS);
    expect(lanes).toEqual({ a: 0, b: 2, c: 1, d: 0 });
  });

  it("handles a tightly-packed 3-clique with an arch shape", () => {
    // Three events within ~50 px on screen — all pairwise conflicting,
    // 3 distinct lanes required (graph-coloring lower bound). Cluster
    // walk: leftmost (a) → 0; then right-to-left of the rest: c → 1
    // (vs a 42.8 < 90, conflict on 0); b → 2 (vs both, conflict on 0
    // and 1). Reading left-to-right: {0, 2, 1} — leftmost low, peak
    // at b in the middle, rightmost at 1.
    const events = [
      { id: "a", originalX: -0.2 },
      { id: "b", originalX: 0 },
      { id: "c", originalX: 0.2 },
    ];
    const lanes = computeLabelLanes(events, 0, GRANULARITY_WIDTHS.year, CANVAS);
    expect(lanes).toEqual({ a: 0, b: 2, c: 1 });
  });

  it("recycles lanes when subsequent events leave the threshold window", () => {
    // Two clusters separated by enough gap that the second cluster can
    // re-use lane 0. Cluster-based walk (Phase 8.5.13): each cluster's
    // leftmost is placed first at lane 0; the right-to-left rest of a
    // 2-element cluster is just the right one, which conflicts and goes
    // to lane 1. Cluster A at screen-x ~107/150, Cluster B at ~1067/1110.
    const events = [
      { id: "a1", originalX: -5 },
      { id: "a2", originalX: -4.6 },
      { id: "b1", originalX: 4 },
      { id: "b2", originalX: 4.4 },
    ];
    const lanes = computeLabelLanes(events, 0, GRANULARITY_WIDTHS.year, CANVAS);
    expect(lanes.a1).toBe(0); // leftmost of cluster A
    expect(lanes.a2).toBe(1);
    expect(lanes.b1).toBe(0); // leftmost of cluster B
    expect(lanes.b2).toBe(1);
  });

  it("is order-independent: identical input order produces identical lanes", () => {
    const a = [
      { id: "a", originalX: 0 },
      { id: "b", originalX: 0.1 },
      { id: "c", originalX: 0.2 },
    ];
    const b = [...a].reverse();
    expect(computeLabelLanes(a, 0, GRANULARITY_WIDTHS.year, CANVAS)).toEqual(
      computeLabelLanes(b, 0, GRANULARITY_WIDTHS.year, CANVAS),
    );
  });

  it("respects the threshold to within one pixel", () => {
    // Place two events exactly LABEL_OVERLAP_THRESHOLD_PX apart on screen.
    // The pair-distance condition is `< threshold`, so events EXACTLY at
    // the threshold should both fit on lane 0.
    const pixelsPerWorld = CANVAS / GRANULARITY_WIDTHS.year;
    const xGap = LABEL_OVERLAP_THRESHOLD_PX / pixelsPerWorld;
    const events = [
      { id: "a", originalX: 0 },
      { id: "b", originalX: xGap },
    ];
    const lanes = computeLabelLanes(events, 0, GRANULARITY_WIDTHS.year, CANVAS);
    expect(lanes).toEqual({ a: 0, b: 0 });
  });

  it("at month zoom the right cluster spreads enough to clear the threshold", () => {
    // Same dense cluster as the second test, but at month-zoom event
    // scaling (≈ 14.6×) the events explode apart on screen — most fall
    // off-screen but the visibility of lane 0 isn't relevant; we just
    // assert that the placement still terminates and assigns numbers
    // monotonically. Without the spread test, this confirms that the
    // helper is at least sane at finer granularities.
    const events = [
      { id: "a", originalX: -0.5 },
      { id: "b", originalX: -0.166 },
      { id: "c", originalX: 0.166 },
      { id: "d", originalX: 0.5 },
    ];
    const lanes = computeLabelLanes(events, 0, GRANULARITY_WIDTHS.month, CANVAS);
    // Massive on-screen spread at month zoom — every lane comes back to 0.
    expect(lanes).toEqual({ a: 0, b: 0, c: 0, d: 0 });
  });
});
