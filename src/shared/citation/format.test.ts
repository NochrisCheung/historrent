import { describe, it, expect } from "vitest";
import { formatCitation } from "./format";
import type { TCitation } from "@/data/liu_bang.schema";

const SAMPLE: TCitation = {
  work: "Shiji",
  edition: "Zhonghua Shuju 1959 punctuated edition",
  chapter: 8,
  section: "高祖本紀",
  paragraph: 1,
  textAnchor: "高祖，沛豐邑中陽裏",
  uri: "https://ctext.org/shiji/gao-zu-ben-ji/zh#n4897",
  language: "zh-Hant",
};

describe("formatCitation", () => {
  it("renders Traditional Chinese with native delimiters and numerals", () => {
    const f = formatCitation(SAMPLE, "zh-Hant");
    expect(f.label).toBe("《史記》卷八〈高祖本紀〉第一段");
    expect(f.edition).toBe(SAMPLE.edition);
    expect(f.textAnchor).toBe(SAMPLE.textAnchor);
    expect(f.href).toBe("https://ctext.org/shiji/gao-zu-ben-ji/zh#n4897");
  });

  it("renders Simplified Chinese and rewrites the link to ctext.org's /zhs path", () => {
    const f = formatCitation(SAMPLE, "zh-Hans");
    expect(f.label).toBe("《史记》卷八〈高祖本紀〉第一段");
    expect(f.href).toBe("https://ctext.org/shiji/gao-zu-ben-ji/zhs#n4897");
  });

  it("renders English with arabic numerals and parenthesised section", () => {
    const f = formatCitation(SAMPLE, "en");
    expect(f.label).toBe("Shiji, ch. 8 (高祖本紀), §1");
    expect(f.href).toBe("https://ctext.org/shiji/gao-zu-ben-ji/zh#n4897");
  });

  it("omits the section fragment when section is absent", () => {
    const sectionless: TCitation = { ...SAMPLE, section: undefined };
    const zh = formatCitation(sectionless, "zh-Hant");
    expect(zh.label).toBe("《史記》卷八第一段");
    const en = formatCitation(sectionless, "en");
    expect(en.label).toBe("Shiji, ch. 8, §1");
  });

  it("renders Chinese numerals for chapters and paragraphs above 10", () => {
    const high: TCitation = { ...SAMPLE, chapter: 13, paragraph: 22, section: undefined };
    expect(formatCitation(high, "zh-Hant").label).toBe("《史記》卷十三第二十二段");
  });

  it("falls back to arabic numerals for chapter > 99", () => {
    const big: TCitation = { ...SAMPLE, chapter: 130, paragraph: 5, section: undefined };
    expect(formatCitation(big, "zh-Hant").label).toBe("《史記》卷130第五段");
  });
});
