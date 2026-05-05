/**
 * Maps a year (in colloquial signed BCE — see `src/shared/date/bce.ts`) to an
 * x-coordinate in world space.
 *
 * Liu Bang's lifespan is mapped linearly to
 * `[-TIMELINE_WORLD_HALF_WIDTH, +TIMELINE_WORLD_HALF_WIDTH]`. Years outside
 * the lifespan map to coordinates outside that range — used in later phases
 * for items that fall in the curl region beyond the central straight zone.
 */

import {
  LIU_BANG_BORN,
  LIU_BANG_LIFESPAN,
  TIMELINE_WORLD_HALF_WIDTH,
} from "@/shared/constants/timeline";
import { yearsBetween } from "@/shared/date/bce";

export function yearToWorld(year: number): number {
  // `yearsBetween` is BCE/CE-aware (skips the non-existent year 0). Liu Bang's
  // lifespan never crosses zero, but defining the mapping in terms of `yearsBetween`
  // keeps it correct if a future event ever does.
  const offset = yearsBetween(LIU_BANG_BORN, year);
  // Sign: years before LIU_BANG_BORN have negative offset relative to it.
  const signedOffset = year < LIU_BANG_BORN ? -offset : offset;
  const t = signedOffset / LIU_BANG_LIFESPAN;
  return TIMELINE_WORLD_HALF_WIDTH * (2 * t - 1);
}
