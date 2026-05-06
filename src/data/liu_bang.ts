/**
 * Parsed Liu Bang corpus, validated through the Zod schema at module load.
 *
 * Both the canvas (`Timeline.tsx`) and the detail panel (`DetailPanel.tsx`)
 * import this single instance — schema parsing happens once per page load.
 * Schema violations are caught by `liu_bang.test.ts` in CI before they
 * ever reach production.
 */

import { LiuBangCorpus, type TLiuBangCorpus } from "./liu_bang.schema";
import liuBangData from "./liu_bang.json";
import { yearToWorld } from "@/components/canvas/geometry/yearToWorld";
import { centralYear } from "@/shared/date/centralYear";

export const liuBangCorpus = LiuBangCorpus.parse(liuBangData);

/** Events sorted chronologically by earliest possible date. */
export const liuBangEventsSorted = [...liuBangCorpus.events].sort(
  (a, b) => a.date.startEarliest - b.date.startEarliest,
);

/** The chronologically first event (Liu Bang's birth). */
export const firstEvent = liuBangEventsSorted[0]!;

/**
 * World-x coordinate of the first event. The initial camera centres on this
 * point (plan §1.2: "first event at middle in the beginning"), and the
 * curve uniform `uCurveCenter` initialises here too so the curl recedes at
 * the viewport edges around it.
 */
export const FIRST_EVENT_WORLD_X = yearToWorld(centralYear(firstEvent.date));

/**
 * Look up an event by its UUID `id`. Returns `undefined` for unknown ids —
 * the panel uses this to render nothing when `selectedId` matches no event.
 */
export function findEvent(id: string | null) {
  if (id === null) return undefined;
  return liuBangCorpus.events.find((e) => e.id === id);
}

/**
 * Look up an event by its readable slug. Used by E2E helpers (which
 * select dots via `data-event-name="${slug}"`) to translate back to the
 * UUID for store-state assertions.
 */
export function findEventBySlug(slug: string) {
  return liuBangCorpus.events.find((e) => e.slug === slug);
}

/**
 * Test affordance: expose the parsed corpus on `window.__historrentCorpus`
 * so Playwright specs can map slug → UUID without crawling the DOM.
 * Costs one global property; safe in production.
 */
declare global {
  interface Window {
    __historrentCorpus?: TLiuBangCorpus;
  }
}

if (typeof window !== "undefined") {
  window.__historrentCorpus = liuBangCorpus;
}
