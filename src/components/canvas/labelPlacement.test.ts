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
    // a→b/b→c/c→d are ~36 px apart, but a→d is ~106.7 px (≥ 90 px), so:
    //   a → lane 0
    //   b → lane 1 (lane 0 still occupied by a within threshold)
    //   c → lane 2 (lanes 0 & 1 still within threshold)
    //   d → lane 0 recycles (a's 586.7 is now 106.7 px away, past threshold)
    const events = [
      { id: "a", originalX: -0.5 },
      { id: "b", originalX: -0.166 },
      { id: "c", originalX: 0.166 },
      { id: "d", originalX: 0.5 },
    ];
    const lanes = computeLabelLanes(events, 0, GRANULARITY_WIDTHS.year, CANVAS);
    expect(lanes).toEqual({ a: 0, b: 1, c: 2, d: 0 });
  });

  it("handles a tightly-packed cluster with three lanes", () => {
    // Three events within ~50 px on screen — all under threshold, no
    // recycling possible. Expect lanes 0, 1, 2.
    const events = [
      { id: "a", originalX: -0.2 },
      { id: "b", originalX: 0 },
      { id: "c", originalX: 0.2 },
    ];
    const lanes = computeLabelLanes(events, 0, GRANULARITY_WIDTHS.year, CANVAS);
    expect(lanes).toEqual({ a: 0, b: 1, c: 2 });
  });

  it("recycles lanes when subsequent events leave the threshold window", () => {
    // Two clusters separated by enough gap that the second cluster can
    // re-use lane 0. Cluster A at the left (~screen-x 100–200), Cluster B
    // at the right (~screen-x 1000+). Within each cluster events overlap.
    const events = [
      { id: "a1", originalX: -5 },
      { id: "a2", originalX: -4.6 },
      { id: "b1", originalX: 4 },
      { id: "b2", originalX: 4.4 },
    ];
    const lanes = computeLabelLanes(events, 0, GRANULARITY_WIDTHS.year, CANVAS);
    expect(lanes.a1).toBe(0);
    expect(lanes.a2).toBe(1);
    // Second cluster: with 0.4 wu = ~43 px gap (< threshold), b2 must
    // bump to lane 1; but b1 should hit lane 0 since the previous
    // lane-0 occupant (a1) is far away.
    expect(lanes.b1).toBe(0);
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
