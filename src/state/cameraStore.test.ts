import { describe, it, expect, beforeEach } from "vitest";
import { useCameraStore, snapToGranularity, GRANULARITY_WIDTHS } from "./cameraStore";
import { FIRST_EVENT_WORLD_X } from "@/data/liu_bang";

describe("useCameraStore", () => {
  beforeEach(() => {
    useCameraStore.getState().reset();
  });

  it("starts centred on the first event at year-zoom", () => {
    const s = useCameraStore.getState();
    expect(s.cameraX).toBe(FIRST_EVENT_WORLD_X);
    expect(s.viewportWorldWidth).toBe(GRANULARITY_WIDTHS.year);
    expect(s.granularity).toBe("year");
  });

  it("setters update individual fields", () => {
    useCameraStore.getState().setCameraX(2);
    useCameraStore.getState().setViewportWorldWidth(0.5);
    useCameraStore.getState().setGranularity("month");
    const s = useCameraStore.getState();
    expect(s.cameraX).toBe(2);
    expect(s.viewportWorldWidth).toBe(0.5);
    expect(s.granularity).toBe("month");
  });

  it("reset returns to initial state", () => {
    useCameraStore.getState().setCameraX(99);
    useCameraStore.getState().setGranularity("day");
    useCameraStore.getState().reset();
    const s = useCameraStore.getState();
    expect(s.cameraX).toBe(FIRST_EVENT_WORLD_X);
    expect(s.granularity).toBe("year");
  });

  it("exposes itself on window for E2E", () => {
    expect(window.__historrentCameraStore).toBe(useCameraStore);
  });
});

describe("snapToGranularity", () => {
  it("returns each level when given its exact width", () => {
    expect(snapToGranularity(GRANULARITY_WIDTHS.year)).toBe("year");
    expect(snapToGranularity(GRANULARITY_WIDTHS.month)).toBe("month");
    expect(snapToGranularity(GRANULARITY_WIDTHS.day)).toBe("day");
  });

  it("snaps wide widths to year", () => {
    expect(snapToGranularity(GRANULARITY_WIDTHS.year * 1.5)).toBe("year");
  });

  it("snaps tiny widths to day", () => {
    expect(snapToGranularity(GRANULARITY_WIDTHS.day / 2)).toBe("day");
  });

  it("uses log-space distance, so geometric midpoints flip cleanly", () => {
    // The geometric midpoint between year and month should be ambiguous —
    // pick anything just below it to confirm we're on the month side.
    const yearLog = Math.log(GRANULARITY_WIDTHS.year);
    const monthLog = Math.log(GRANULARITY_WIDTHS.month);
    const justBelowMidpoint = Math.exp((yearLog + monthLog) / 2 - 0.01);
    expect(snapToGranularity(justBelowMidpoint)).toBe("month");
  });
});
