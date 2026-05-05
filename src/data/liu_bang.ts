/**
 * Parsed Liu Bang corpus, validated through the Zod schema at module load.
 *
 * Both the canvas (`Timeline.tsx`) and the detail panel (`DetailPanel.tsx`)
 * import this single instance — schema parsing happens once per page load.
 * Schema violations are caught by `liu_bang.test.ts` in CI before they
 * ever reach production.
 */

import { LiuBangCorpus } from "./liu_bang.schema";
import liuBangData from "./liu_bang.json";

export const liuBangCorpus = LiuBangCorpus.parse(liuBangData);

/**
 * Look up an event by id. Returns undefined for unknown ids — the panel uses
 * this to render nothing when `selectedId` matches no event.
 */
export function findEvent(id: string | null) {
  if (id === null) return undefined;
  return liuBangCorpus.events.find((e) => e.id === id);
}
