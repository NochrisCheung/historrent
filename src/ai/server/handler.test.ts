import { describe, it, expect, vi } from "vitest";
import { handleSynthesise, EventNotFoundError, type HandlerDependencies } from "./handler";
import { createInMemoryCache } from "./cache";
import type { DeepSeekClient } from "./deepseek";
import { liuBangCorpus } from "@/data/liu_bang";

const HONGMEN = liuBangCorpus.events.find((e) => e.slug === "hongmen-banquet")!;
const IMPERIAL = liuBangCorpus.events.find((e) => e.slug === "imperial-accession")!;

function makeDeepSeek(content: string): { client: DeepSeekClient; chat: ReturnType<typeof vi.fn> } {
  const chat = vi.fn(async () => ({ content, model: "deepseek-v4-flash" }));
  return { client: { chat }, chat };
}

function makeDeps(content = "测试合成 [Shiji-8-23]"): HandlerDependencies & {
  chat: ReturnType<typeof vi.fn>;
} {
  const cache = createInMemoryCache();
  const { client, chat } = makeDeepSeek(content);
  return { cache, deepseek: client, chat, now: () => "2026-05-06T00:00:00.000Z" };
}

describe("handleSynthesise", () => {
  it("calls DeepSeek on cache miss, then writes the result to the cache", async () => {
    const deps = makeDeps();
    const res = await handleSynthesise({
      eventId: HONGMEN.id,
      language: "zh-Hans",
      deps,
    });
    expect(res.cached).toBe(false);
    expect(res.synthesis).toBe("测试合成 [Shiji-8-23]");
    expect(deps.chat).toHaveBeenCalledTimes(1);
  });

  it("returns the cached value on the second call (no DeepSeek call)", async () => {
    const deps = makeDeps();
    await handleSynthesise({ eventId: HONGMEN.id, language: "zh-Hans", deps });
    expect(deps.chat).toHaveBeenCalledTimes(1);

    const second = await handleSynthesise({
      eventId: HONGMEN.id,
      language: "zh-Hans",
      deps,
    });
    expect(second.cached).toBe(true);
    expect(second.synthesis).toBe("测试合成 [Shiji-8-23]");
    expect(deps.chat).toHaveBeenCalledTimes(1);
  });

  it("switching language produces a separate cache entry", async () => {
    const deps = makeDeps();
    await handleSynthesise({ eventId: HONGMEN.id, language: "zh-Hans", deps });
    await handleSynthesise({ eventId: HONGMEN.id, language: "zh-Hant", deps });
    expect(deps.chat).toHaveBeenCalledTimes(2);
  });

  it("switching event produces a separate cache entry", async () => {
    const deps = makeDeps();
    await handleSynthesise({ eventId: HONGMEN.id, language: "zh-Hans", deps });
    await handleSynthesise({ eventId: IMPERIAL.id, language: "zh-Hans", deps });
    expect(deps.chat).toHaveBeenCalledTimes(2);
  });

  it("response includes eventId, language, citations, and timestamps", async () => {
    const deps = makeDeps();
    const res = await handleSynthesise({
      eventId: HONGMEN.id,
      language: "zh-Hans",
      deps,
    });
    expect(res.eventId).toBe(HONGMEN.id);
    expect(res.language).toBe("zh-Hans");
    expect(res.citations.length).toBe(HONGMEN.citations.length);
    expect(res.citations[0]?.label).toMatch(/^Shiji-\d+-\d+$/);
    expect(res.promptVersion).toBe("v1");
    expect(res.generatedAt).toBe("2026-05-06T00:00:00.000Z");
  });

  it("refusal text flows through verbatim — no detection, no retry", async () => {
    const refusal = "上述来源段落信息不足以回答此问题。";
    const deps = makeDeps(refusal);
    const res = await handleSynthesise({
      eventId: HONGMEN.id,
      language: "zh-Hans",
      deps,
    });
    expect(res.synthesis).toBe(refusal);
    expect(deps.chat).toHaveBeenCalledTimes(1);

    // Refusal IS cached — same as a normal answer.
    const second = await handleSynthesise({
      eventId: HONGMEN.id,
      language: "zh-Hans",
      deps,
    });
    expect(second.cached).toBe(true);
    expect(second.synthesis).toBe(refusal);
    expect(deps.chat).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown event ids", async () => {
    const deps = makeDeps();
    await expect(
      handleSynthesise({
        eventId: "00000000-0000-0000-0000-000000000000",
        language: "zh-Hans",
        deps,
      }),
    ).rejects.toBeInstanceOf(EventNotFoundError);
    expect(deps.chat).not.toHaveBeenCalled();
  });

  it("rejects malformed event ids (Zod fail)", async () => {
    const deps = makeDeps();
    await expect(
      handleSynthesise({
        eventId: "not-a-uuid",
        language: "zh-Hans",
        deps,
      }),
    ).rejects.toBeDefined();
    expect(deps.chat).not.toHaveBeenCalled();
  });

  it("rejects unknown languages (Zod fail)", async () => {
    const deps = makeDeps();
    await expect(
      handleSynthesise({
        eventId: HONGMEN.id,
        language: "en" as never,
        deps,
      }),
    ).rejects.toBeDefined();
    expect(deps.chat).not.toHaveBeenCalled();
  });
});
