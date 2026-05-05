import { describe, it, expect } from "vitest";
import { LiuBangCorpus } from "./liu_bang.schema";
import liuBangData from "./liu_bang.json";
import { LIU_BANG_BORN, LIU_BANG_DIED } from "@/shared/constants/timeline";

describe("liu_bang.json", () => {
  it("validates against the LiuBangCorpus schema", () => {
    const result = LiuBangCorpus.safeParse(liuBangData);
    if (!result.success) {
      throw new Error(
        "Schema violations:\n" +
          result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n"),
      );
    }
  });

  it("subject is Liu Bang and matches the timeline constants", () => {
    const corpus = LiuBangCorpus.parse(liuBangData);
    expect(corpus.subject.id).toBe("liu-bang");
    // The earliest possible birth is the canonical LIU_BANG_BORN constant; the
    // latest possible death is LIU_BANG_DIED. CameraRig and yearToWorld both
    // depend on this alignment.
    expect(corpus.subject.born.startEarliest).toBe(LIU_BANG_BORN);
    expect(corpus.subject.died.endLatest).toBe(LIU_BANG_DIED);
  });

  it("every event has at least one ctext.org citation pointing into 高祖本紀 (chapter 8)", () => {
    const corpus = LiuBangCorpus.parse(liuBangData);
    for (const event of corpus.events) {
      expect(event.citations.length).toBeGreaterThanOrEqual(1);
      const hasGaoZu = event.citations.some(
        (c) => c.chapter === 8 && /ctext\.org\/shiji\/gao-zu-ben-ji\/zh#n\d+/.test(c.uri),
      );
      expect(hasGaoZu, `event "${event.id}" lacks a 高祖本紀 ctext.org citation`).toBe(true);
    }
  });

  it("every event date falls inside Liu Bang's lifespan", () => {
    const corpus = LiuBangCorpus.parse(liuBangData);
    for (const event of corpus.events) {
      expect(event.date.startEarliest).toBeGreaterThanOrEqual(LIU_BANG_BORN);
      expect(event.date.endLatest).toBeLessThanOrEqual(LIU_BANG_DIED);
    }
  });

  it("all event ids are unique slugs", () => {
    const corpus = LiuBangCorpus.parse(liuBangData);
    const ids = corpus.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
