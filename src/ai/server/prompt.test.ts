import { describe, it, expect } from "vitest";
import { buildSynthesisPrompt, PROMPT_VERSION, SYSTEM_PROMPT } from "./prompt";
import { liuBangCorpus } from "@/data/liu_bang";

const LANGUAGES = ["zh-Hans", "zh-Hant"] as const;

describe("buildSynthesisPrompt", () => {
  it("returns the verbatim system prompt regardless of language", () => {
    for (const lang of LANGUAGES) {
      const event = liuBangCorpus.events[0]!;
      const result = buildSynthesisPrompt(event, lang);
      expect(result.system).toBe(SYSTEM_PROMPT);
    }
  });

  it("returns the locked-in PROMPT_VERSION", () => {
    const event = liuBangCorpus.events[0]!;
    const result = buildSynthesisPrompt(event, "zh-Hans");
    expect(result.version).toBe(PROMPT_VERSION);
  });

  it("uses the Hans event name and language hint when language=zh-Hans", () => {
    const event = liuBangCorpus.events.find((e) => e.slug === "hongmen-banquet")!;
    const result = buildSynthesisPrompt(event, "zh-Hans");
    expect(result.user).toContain(event.name.zhHans); // "鸿门宴"
    expect(result.user).not.toContain(event.name.zhHant); // not "鴻門宴"
    expect(result.user).toContain("请用简体中文回答。");
  });

  it("uses the Hant event name and language hint when language=zh-Hant", () => {
    const event = liuBangCorpus.events.find((e) => e.slug === "hongmen-banquet")!;
    const result = buildSynthesisPrompt(event, "zh-Hant");
    expect(result.user).toContain(event.name.zhHant); // "鴻門宴"
    expect(result.user).toContain("請用繁體中文回答。");
  });

  it("emits one [Shiji-{chapter}-{paragraph}] line per citation, in order", () => {
    for (const event of liuBangCorpus.events) {
      const result = buildSynthesisPrompt(event, "zh-Hans");
      for (const c of event.citations) {
        const tag = `[Shiji-${c.chapter}-${c.paragraph}]`;
        expect(result.user).toContain(tag);
        expect(result.user).toContain(c.text);
      }
      // Citations appear in order — assert that each citation's index in the
      // user prompt is monotonically increasing.
      const indices = event.citations.map((c) =>
        result.user.indexOf(`[Shiji-${c.chapter}-${c.paragraph}]`),
      );
      const sortedAsc = [...indices].sort((a, b) => a - b);
      expect(indices).toEqual(sortedAsc);
    }
  });

  it("renders the date via formatYear (前NNN年)", () => {
    const event = liuBangCorpus.events.find((e) => e.slug === "imperial-accession")!;
    const result = buildSynthesisPrompt(event, "zh-Hans");
    expect(result.user).toContain("前202年");
  });

  it("passageHash is deterministic and changes when citation text changes", () => {
    const event = liuBangCorpus.events[0]!;
    const a = buildSynthesisPrompt(event, "zh-Hans").passageHash;
    const b = buildSynthesisPrompt(event, "zh-Hans").passageHash;
    expect(a).toBe(b);

    // Mutate one citation's text — passageHash must shift.
    const mutated = {
      ...event,
      citations: event.citations.map((c, i) => (i === 0 ? { ...c, text: c.text + "X" } : c)),
    };
    const c = buildSynthesisPrompt(mutated, "zh-Hans").passageHash;
    expect(c).not.toBe(a);
  });

  it("passageHash is the same across languages — depends only on passage text", () => {
    const event = liuBangCorpus.events[0]!;
    const hans = buildSynthesisPrompt(event, "zh-Hans").passageHash;
    const hant = buildSynthesisPrompt(event, "zh-Hant").passageHash;
    expect(hans).toBe(hant);
  });

  it("snapshots — Hans + Hant for all 5 seed events", () => {
    for (const event of liuBangCorpus.events) {
      for (const lang of LANGUAGES) {
        const result = buildSynthesisPrompt(event, lang);
        expect({
          slug: event.slug,
          language: lang,
          version: result.version,
          system: result.system,
          user: result.user,
          passageHash: result.passageHash,
        }).toMatchSnapshot();
      }
    }
  });
});
