import { describe, it, expect, beforeEach } from "vitest";
import { useTimelineStore } from "./timelineStore";

describe("useTimelineStore", () => {
  beforeEach(() => {
    useTimelineStore.getState().reset();
  });

  it("starts with no hover, no selection, zoom=year", () => {
    const s = useTimelineStore.getState();
    expect(s.hoveredId).toBeNull();
    expect(s.selectedId).toBeNull();
    expect(s.zoom).toBe("year");
  });

  it("setHovered updates only hoveredId", () => {
    useTimelineStore.getState().setHovered("birth");
    const s = useTimelineStore.getState();
    expect(s.hoveredId).toBe("birth");
    expect(s.selectedId).toBeNull();
  });

  it("setHovered(null) clears the hover", () => {
    useTimelineStore.getState().setHovered("birth");
    useTimelineStore.getState().setHovered(null);
    expect(useTimelineStore.getState().hoveredId).toBeNull();
  });

  it("setSelected updates only selectedId", () => {
    useTimelineStore.getState().setSelected("hongmen-banquet");
    const s = useTimelineStore.getState();
    expect(s.selectedId).toBe("hongmen-banquet");
    expect(s.hoveredId).toBeNull();
  });

  it("setZoom updates only zoom", () => {
    useTimelineStore.getState().setZoom("month");
    expect(useTimelineStore.getState().zoom).toBe("month");
  });

  it("reset returns to initial state", () => {
    const s = useTimelineStore.getState();
    s.setHovered("a");
    s.setSelected("b");
    s.setZoom("day");
    s.reset();
    const after = useTimelineStore.getState();
    expect(after.hoveredId).toBeNull();
    expect(after.selectedId).toBeNull();
    expect(after.zoom).toBe("year");
  });

  it("exposes itself on window for E2E", () => {
    expect(window.__historrentStore).toBe(useTimelineStore);
  });
});
