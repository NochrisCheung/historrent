import type { TFuzzyDate } from "@/data/liu_bang.schema";

/**
 * The "central" year of a {@link TFuzzyDate}, rounded to an integer for use
 * with `yearToWorld` (which only accepts integer years).
 *
 * For an exact year (`startEarliest === startLatest === endEarliest === endLatest`)
 * this returns that year unchanged. For a fuzzy range (e.g. Liu Bang's birth
 * `-256/-247`) this returns the rounded midpoint — the visible position is
 * approximate; the exact range is preserved by the EDTF string used in display.
 */
export function centralYear(date: TFuzzyDate): number {
  const midpoint = (date.startEarliest + date.endLatest) / 2;
  const rounded = Math.round(midpoint);
  // Defensive: if the rounded midpoint hits year 0 (only possible if a fuzzy
  // range straddles the BCE/CE boundary in a future corpus), nudge to -1.
  return rounded === 0 ? -1 : rounded;
}
