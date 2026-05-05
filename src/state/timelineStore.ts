/**
 * Canvas state — hover, selection, and zoom granularity.
 *
 * Lives outside React's reconciler so the canvas can react to user input at
 * 60fps without re-rendering the whole tree. Components subscribe via
 * Zustand selectors with equality (engineering-practices.md §1.1):
 *
 *   const hovered = useTimelineStore((s) => s.hoveredId === event.id);
 *
 * Re-renders fire only when *that boolean* flips, not on every store mutation.
 */

import { create } from "zustand";

export type Granularity = "year" | "month" | "day";

interface TimelineState {
  hoveredId: string | null;
  selectedId: string | null;
  zoom: Granularity;
}

interface TimelineActions {
  setHovered: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  setZoom: (zoom: Granularity) => void;
  reset: () => void;
}

const INITIAL_STATE: TimelineState = {
  hoveredId: null,
  selectedId: null,
  zoom: "year",
};

export const useTimelineStore = create<TimelineState & TimelineActions>((set) => ({
  ...INITIAL_STATE,
  setHovered: (hoveredId) => set({ hoveredId }),
  setSelected: (selectedId) => set({ selectedId }),
  setZoom: (zoom) => set({ zoom }),
  reset: () => set(INITIAL_STATE),
}));

/**
 * Test affordance: exposes the store on `window.__historrentStore` so
 * Playwright specs can assert state without scraping WebGL pixels.
 * Costs one global property; safe in production.
 */
declare global {
  interface Window {
    __historrentStore?: typeof useTimelineStore;
  }
}

if (typeof window !== "undefined") {
  window.__historrentStore = useTimelineStore;
}
