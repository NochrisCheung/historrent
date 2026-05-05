/**
 * Render a {@link TCitation} for display in the user's chosen UI language.
 *
 * For ctext.org links, the canonical stored URI points at the Traditional
 * (`/zh`) variant of the passage. When the UI is in Simplified Chinese
 * we swap to the Simplified (`/zhs`) variant so the linked text matches
 * the script the user is reading.
 */

import type { TCitation } from "@/data/liu_bang.schema";

export type DisplayLanguage = "zh-Hans" | "zh-Hant" | "en";

export interface FormattedCitation {
  /** Short label suitable for inline use (e.g. "《史記》卷八〈高祖本紀〉第1段"). */
  label: string;
  /** Edition reference (e.g. "中華書局1959年點校本"). */
  edition: string;
  /** First ~10 characters of the cited passage. */
  textAnchor: string;
  /** ctext.org URL appropriate for the display language. */
  href: string;
}

const LABELS = {
  "zh-Hans": {
    work: { Shiji: "史记" },
    chapterPrefix: "卷",
    sectionOpen: "〈",
    sectionClose: "〉",
    paragraphPrefix: "第",
    paragraphSuffix: "段",
  },
  "zh-Hant": {
    work: { Shiji: "史記" },
    chapterPrefix: "卷",
    sectionOpen: "〈",
    sectionClose: "〉",
    paragraphPrefix: "第",
    paragraphSuffix: "段",
  },
  en: {
    work: { Shiji: "Shiji" },
    chapterPrefix: "ch. ",
    sectionOpen: " (",
    sectionClose: ")",
    paragraphPrefix: "§",
    paragraphSuffix: "",
  },
} as const;

const CHINESE_NUMERALS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

/**
 * Renders an integer 1–99 into Chinese numerals (e.g. 8 → "八", 12 → "十二").
 * For chapter numbers in Shiji which are at most 130, we extend to handle
 * the 11–99 range; values above 99 fall back to the Arabic numeral.
 */
function chineseNumeral(n: number): string {
  if (n < 1 || n > 99) return String(n);
  if (n <= 10) return CHINESE_NUMERALS[n] ?? String(n);
  if (n < 20) return `十${n === 10 ? "" : (CHINESE_NUMERALS[n - 10] ?? "")}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tensStr = `${CHINESE_NUMERALS[tens] ?? ""}十`;
  return ones === 0 ? tensStr : `${tensStr}${CHINESE_NUMERALS[ones] ?? ""}`;
}

/**
 * Convert the canonical `/zh` ctext.org URI to the `/zhs` Simplified variant
 * when the UI is in Simplified Chinese. English UI keeps the Traditional
 * link (ctext.org has English translations available from the toggle, but
 * not on a stable separate path for paragraph anchors).
 */
function languageAwareHref(uri: string, displayLanguage: DisplayLanguage): string {
  if (displayLanguage !== "zh-Hans") return uri;
  return uri.replace(/\/zh(#n\d+)$/, "/zhs$1");
}

export function formatCitation(
  citation: TCitation,
  displayLanguage: DisplayLanguage,
): FormattedCitation {
  const labels = LABELS[displayLanguage];
  const work = labels.work[citation.work];

  const chapterFragment =
    displayLanguage === "en"
      ? `${labels.chapterPrefix}${citation.chapter}`
      : `${labels.chapterPrefix}${chineseNumeral(citation.chapter)}`;

  const sectionFragment = citation.section
    ? `${labels.sectionOpen}${citation.section}${labels.sectionClose}`
    : "";

  const paragraphFragment =
    displayLanguage === "en"
      ? `${labels.paragraphPrefix}${citation.paragraph}`
      : `${labels.paragraphPrefix}${chineseNumeral(citation.paragraph)}${labels.paragraphSuffix}`;

  const workWrapped = displayLanguage === "en" ? work : `《${work}》`;

  const label =
    displayLanguage === "en"
      ? `${workWrapped}, ${chapterFragment}${sectionFragment}, ${paragraphFragment}`
      : `${workWrapped}${chapterFragment}${sectionFragment}${paragraphFragment}`;

  return {
    label,
    edition: citation.edition,
    textAnchor: citation.textAnchor,
    href: languageAwareHref(citation.uri, displayLanguage),
  };
}
