/**
 * BCE-aware date helpers.
 *
 * Year-numbering convention (see implementation_plan §3.3):
 * **Colloquial signed BCE.** −256 means 256 BCE plain; +195 means 195 CE.
 * Year 0 does NOT exist (gap between 1 BCE and 1 CE). This is *not* the
 * astronomical / proleptic Gregorian convention.
 *
 * EDTF subset accepted by `parseEdtf`:
 *   "YYYY"     | "-YYYY"           — exact year
 *   "YYYY?"    | "-YYYY?"          — uncertain year
 *   "YYYY~"    | "-YYYY~"          — approximate year
 *   "YYYY/YYYY"| "-YYYY/-YYYY" etc — interval (start/end may be uncertain)
 *
 * The information that an EDTF string carries about uncertainty (`?`/`~`)
 * is preserved in the original string only — bounds capture the numeric
 * range, not the kind-of-fuzziness marker.
 */

export type Precision = "year" | "month" | "day";

export interface FuzzyDateBounds {
  startEarliest: number;
  startLatest: number;
  endEarliest: number;
  endLatest: number;
  precision: Precision;
}

const SIGNED_YEAR = /^(-?\d{4})([?~])?$/;
const INTERVAL = /^(-?\d{4})\/(-?\d{4})$/;

/**
 * Parse a v1-subset EDTF string into a {@link FuzzyDateBounds}.
 * Throws if the string is outside the supported subset.
 *
 * The schema (`liu_bang.schema.ts`) regex pre-validates shape, so this
 * function is mostly defensive against hand-edited data files.
 */
export function parseEdtf(edtf: string): FuzzyDateBounds {
  const interval = INTERVAL.exec(edtf);
  if (interval) {
    const startStr = interval[1] ?? "";
    const endStr = interval[2] ?? "";
    const start = parseSignedYear(startStr);
    const end = parseSignedYear(endStr);
    return {
      startEarliest: Math.min(start, end),
      startLatest: Math.max(start, end),
      endEarliest: Math.min(start, end),
      endLatest: Math.max(start, end),
      precision: "year",
    };
  }

  const single = SIGNED_YEAR.exec(edtf);
  if (single) {
    const yearStr = single[1] ?? "";
    const y = parseSignedYear(yearStr);
    return {
      startEarliest: y,
      startLatest: y,
      endEarliest: y,
      endLatest: y,
      precision: "year",
    };
  }

  throw new Error(`Unsupported EDTF string: "${edtf}"`);
}

function parseSignedYear(s: string): number {
  const n = Number.parseInt(s, 10);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid signed year: "${s}"`);
  }
  if (n === 0) {
    throw new Error("Year 0 is invalid in colloquial signed BCE");
  }
  return n;
}

/**
 * Number of years between two colloquial signed-BCE years, taking the
 * year-0 gap into account. `from` and `to` may be in any order.
 *
 * Examples:
 *  - yearsBetween(-256, -195) === 61          (entirely BCE)
 *  - yearsBetween( 100,  200) === 100         (entirely CE)
 *  - yearsBetween(-1,    1)   === 1           (skips the non-existent year 0)
 *  - yearsBetween(-50,   50)  === 99          (skips year 0)
 */
export function yearsBetween(from: number, to: number): number {
  assertColloquialYear(from);
  assertColloquialYear(to);
  const a = Math.min(from, to);
  const b = Math.max(from, to);
  // If the interval crosses zero, skip the non-existent year 0.
  return a < 0 && b > 0 ? b - a - 1 : b - a;
}

/**
 * The next colloquial year after `y` (skipping zero).
 *  - nextYear(-1) === 1
 *  - nextYear( 5) === 6
 */
export function nextYear(y: number): number {
  assertColloquialYear(y);
  return y === -1 ? 1 : y + 1;
}

/** True iff the value is a non-zero integer (a valid colloquial signed-BCE year). */
export function isValidColloquialYear(y: number): boolean {
  return Number.isInteger(y) && y !== 0;
}

function assertColloquialYear(y: number): void {
  if (!isValidColloquialYear(y)) {
    throw new Error(`Invalid colloquial signed-BCE year: ${y}`);
  }
}

/**
 * Render a signed-BCE year for display in the given UI language.
 *  - formatYear(-256, "zh-Hans") === "前256年"
 *  - formatYear(-256, "zh-Hant") === "前256年"
 *  - formatYear( 195, "zh-Hans") === "公元195年"
 *  - formatYear( 195, "zh-Hant") === "公元195年"
 *  - formatYear(-256, "en")      === "256 BCE"
 *  - formatYear( 195, "en")      === "195 CE"
 */
export function formatYear(y: number, lang: "zh-Hans" | "zh-Hant" | "en"): string {
  assertColloquialYear(y);
  const abs = Math.abs(y);
  if (lang === "en") {
    return y < 0 ? `${abs} BCE` : `${abs} CE`;
  }
  // Modern Chinese — same surface form for Hans and Hant for these labels.
  return y < 0 ? `前${abs}年` : `公元${abs}年`;
}
