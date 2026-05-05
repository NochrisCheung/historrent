/**
 * Zod schema for the Liu Bang corpus (Phase 1 data shape).
 *
 * Constraints encoded structurally (see implementation_plan §3.3):
 *  - Every event carries ≥ 1 citation; the loader rejects citation-less events.
 *  - Every v1 citation links to a ctext.org passage on the canonical
 *    Traditional ("/zh") path; non-ctext URIs are rejected.
 *  - `paragraph` and `textAnchor` are required — without them a citation
 *    isn't actually verifiable.
 *  - Every name has both Simplified and Traditional forms; single-form
 *    names are rejected.
 *  - `FuzzyDate` carries both an EDTF canonical string and pre-computed
 *    bounds (colloquial signed BCE: −256 = 256 BCE, year 0 reserved).
 *
 * Year-numbering convention: colloquial signed BCE, NOT strict ISO 8601 /
 * proleptic Gregorian. See implementation_plan §3.3.
 */

import { z } from "zod";

/** Canonical ctext.org URI for v1: must point to /zh (Traditional) with a numeric paragraph anchor. */
export const CtextUri = z.string().regex(/^https:\/\/ctext\.org\/[a-z-/]+\/zh#n\d+$/, {
  message: "v1 citations must link to a ctext.org/zh passage with a numeric paragraph anchor",
});

export const Citation = z.object({
  work: z.literal("Shiji"),
  edition: z.string(),
  chapter: z.number().int().positive(),
  section: z.string().optional(),
  paragraph: z.number().int().positive(),
  textAnchor: z.string().min(1),
  uri: CtextUri,
  language: z.enum(["zh-Hant", "zh-Hans"]),
});
export type TCitation = z.infer<typeof Citation>;

/** EDTF subset accepted by `parseEdtf` (see src/shared/date/bce.ts). */
const EdtfString = z.string().regex(/^-?\d{4}[?~]?(?:\/-?\d{4})?$/, {
  message: "EDTF must be one of: YYYY, -YYYY, YYYY?, YYYY~, YYYY/YYYY (and signed variants)",
});

export const FuzzyDate = z
  .object({
    edtf: EdtfString,
    precision: z.enum(["year", "month", "day"]),
    // Colloquial signed BCE (see "Year-numbering convention" above).
    // -256 = 256 BCE, 195 = 195 CE; year 0 is invalid.
    startEarliest: z.number().int(),
    startLatest: z.number().int(),
    endEarliest: z.number().int(),
    endLatest: z.number().int(),
  })
  .refine(
    (d) => d.startEarliest !== 0 && d.startLatest !== 0 && d.endEarliest !== 0 && d.endLatest !== 0,
    { message: "Year 0 is invalid in colloquial signed BCE; -1 means 1 BCE and 1 means 1 CE" },
  )
  .refine(
    (d) =>
      d.startEarliest <= d.startLatest &&
      d.endEarliest <= d.endLatest &&
      d.startEarliest <= d.endLatest,
    { message: "FuzzyDate bounds must be ordered: startEarliest ≤ startLatest ≤ endLatest" },
  );
export type TFuzzyDate = z.infer<typeof FuzzyDate>;

const NameVariants = z.object({
  zhHans: z.string().min(1),
  zhHant: z.string().min(1),
  pinyin: z.string().optional(),
  en: z.string().optional(),
});
export type TNameVariants = z.infer<typeof NameVariants>;

/** Description has only the script variants (no pinyin / english reduction). */
const DescriptionVariants = z.object({
  zhHans: z.string().min(1),
  zhHant: z.string().min(1),
});
export type TDescriptionVariants = z.infer<typeof DescriptionVariants>;

export const LiuBangEvent = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, {
    message: "id must be a lowercase, hyphen-separated slug",
  }),
  name: NameVariants,
  date: FuzzyDate,
  description: DescriptionVariants,
  citations: z.array(Citation).min(1),
  significance: z.enum(["major", "standard", "minor"]),
  tags: z.array(z.string()).default([]),
});
export type TLiuBangEvent = z.infer<typeof LiuBangEvent>;

export const LiuBangCorpus = z.object({
  subject: z.object({
    id: z.literal("liu-bang"),
    name: NameVariants,
    born: FuzzyDate,
    died: FuzzyDate,
  }),
  events: z.array(LiuBangEvent).min(1),
});
export type TLiuBangCorpus = z.infer<typeof LiuBangCorpus>;
