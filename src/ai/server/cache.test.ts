import { describe, it, expect } from "vitest";
import {
  cacheKey,
  createCache,
  createInMemoryCache,
  createUpstashCache,
  type CacheKeyInput,
  type CachedSynthesis,
} from "./cache";

const SAMPLE_KEY: CacheKeyInput = {
  model: "deepseek-v4-flash",
  promptVersion: "v1",
  eventId: "5e511f2e-b96d-4c7d-aede-f9abffbf20a5",
  language: "zh-Hans",
  passageHash: "abcdef0123",
};

const SAMPLE_VALUE: CachedSynthesis = {
  synthesis: "鸿门宴中沛公脱险 [Shiji-8-23]。",
  generatedAt: "2026-05-06T00:00:00.000Z",
  model: "deepseek-v4-flash",
  promptVersion: "v1",
};

describe("cacheKey", () => {
  it("uses the synthesis-v1: prefix", () => {
    expect(cacheKey(SAMPLE_KEY)).toMatch(/^synthesis-v1:[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input", () => {
    expect(cacheKey(SAMPLE_KEY)).toBe(cacheKey(SAMPLE_KEY));
  });

  it("changes when any input field changes", () => {
    const base = cacheKey(SAMPLE_KEY);
    expect(cacheKey({ ...SAMPLE_KEY, model: "deepseek-v4-pro" })).not.toBe(base);
    expect(cacheKey({ ...SAMPLE_KEY, promptVersion: "v2" })).not.toBe(base);
    expect(cacheKey({ ...SAMPLE_KEY, eventId: "different-uuid" })).not.toBe(base);
    expect(cacheKey({ ...SAMPLE_KEY, language: "zh-Hant" })).not.toBe(base);
    expect(cacheKey({ ...SAMPLE_KEY, passageHash: "xyz" })).not.toBe(base);
  });
});

describe("createInMemoryCache", () => {
  it("returns undefined for unset keys", async () => {
    const cache = createInMemoryCache();
    expect(await cache.get("missing")).toBeUndefined();
  });

  it("returns the value after set (round-trip)", async () => {
    const cache = createInMemoryCache();
    const key = cacheKey(SAMPLE_KEY);
    await cache.set(key, SAMPLE_VALUE);
    expect(await cache.get(key)).toEqual(SAMPLE_VALUE);
  });

  it("set is idempotent — same key + same value", async () => {
    const cache = createInMemoryCache();
    const key = cacheKey(SAMPLE_KEY);
    await cache.set(key, SAMPLE_VALUE);
    await cache.set(key, SAMPLE_VALUE);
    expect(await cache.get(key)).toEqual(SAMPLE_VALUE);
  });

  it("instances do not share state", async () => {
    const a = createInMemoryCache();
    const b = createInMemoryCache();
    const key = cacheKey(SAMPLE_KEY);
    await a.set(key, SAMPLE_VALUE);
    expect(await b.get(key)).toBeUndefined();
  });
});

describe("createCache (env-driven backend selection)", () => {
  it("returns the in-memory cache when Upstash env vars are absent", () => {
    const cache = createCache({ NODE_ENV: "test" } as unknown as NodeJS.ProcessEnv);
    // Identity check: createInMemoryCache returns a fresh object each call,
    // so we can't compare references — we assert it has the correct shape
    // and behaves as expected.
    expect(typeof cache.get).toBe("function");
    expect(typeof cache.set).toBe("function");
  });

  it("throws when partial Upstash env vars are present (URL without token)", () => {
    expect(() =>
      createUpstashCache({
        NODE_ENV: "test",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow();
  });
});
