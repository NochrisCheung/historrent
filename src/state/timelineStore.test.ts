import { describe, it, expect, beforeEach } from "vitest";
import { useTimelineStore } from "./timelineStore";

describe("useTimelineStore", () => {
  beforeEach(() => {
    useTimelineStore.getState().reset();
  });

  it("starts with no hover and no selection", () => {
    const s = useTimelineStore.getState();
    expect(s.hoveredId).toBeNull();
    expect(s.selectedId).toBeNull();
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

  it("reset returns to initial state", () => {
    const s = useTimelineStore.getState();
    s.setHovered("a");
    s.setSelected("b");
    s.reset();
    const after = useTimelineStore.getState();
    expect(after.hoveredId).toBeNull();
    expect(after.selectedId).toBeNull();
  });

  it("exposes itself on window for E2E", () => {
    expect(window.__historrentStore).toBe(useTimelineStore);
  });
});
