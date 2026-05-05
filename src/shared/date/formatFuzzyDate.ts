import type { TFuzzyDate } from "@/data/liu_bang.schema";
import { formatYear } from "./bce";

export type DisplayLanguage = "zh-Hans" | "zh-Hant" | "en";

/**
 * Render a {@link TFuzzyDate} for human display.
 *  - Exact year (`startEarliest === endLatest`): a single year, e.g. "前202年".
 *  - Range (`startEarliest !== endLatest`): start and end joined with an
 *    en-dash, e.g. "前256–前247年" — Liu Bang's disputed birth year.
 *
 * The `?` and `~` markers in the original EDTF string are NOT rendered here —
 * they're a Phase 11 visual concern. The bounds capture the numeric range,
 * which is what the user needs to see.
 */
export function formatFuzzyDate(date: TFuzzyDate, lang: DisplayLanguage): string {
  if (date.startEarliest === date.endLatest) {
    return formatYear(date.startEarliest, lang);
  }
  return `${formatYear(date.startEarliest, lang)}–${formatYear(date.endLatest, lang)}`;
}
