/**
 * Synthesis cache (Phase 9).
 *
 * Two interchangeable backends behind a small `SynthesisCache`
 * interface:
 *
 *  - **Upstash Redis** when both `UPSTASH_REDIS_REST_URL` and
 *    `UPSTASH_REDIS_REST_TOKEN` are present (production on Vercel,
 *    optionally local dev once provisioned). Key prefix `synthesis-v1:`.
 *    TTL is `none` — cache is invalidated only by bumping
 *    `PROMPT_VERSION` in `prompt.ts`.
 *  - **In-process Map** otherwise (local dev without Upstash). Same
 *    interface; entries persist for the lifetime of the dev process and
 *    are wiped on restart.
 *
 * The cache key is computed from
 * `(model + promptVersion + event.id + language + passageHash)` —
 * see `cacheKey()` below. UUID `event.id` (not slug) so that any
 * future renaming of the human-readable slug never invalidates a cache.
 */

import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";

const KEY_PREFIX = "synthesis-v1:";

export interface CachedSynthesis {
  /** The model output. */
  synthesis: string;
  /** Refusal text flows through unchanged — no special casing. */
  /** ISO-8601 timestamp of when DeepSeek produced this entry. */
  generatedAt: string;
  /** Echoed model + promptVersion for diagnostic clarity on cache hits. */
  model: string;
  promptVersion: string;
}

export interface CacheKeyInput {
  model: string;
  promptVersion: string;
  /** Event UUID (NOT slug — slug renames must not invalidate caches). */
  eventId: string;
  language: "zh-Hans" | "zh-Hant";
  /** SHA-256 of the citation passages — supplied by `prompt.ts`. */
  passageHash: string;
}

/**
 * Hash the input bundle into the storage key.
 * Same input → same key → same cached output.
 */
export function cacheKey(input: CacheKeyInput): string {
  const parts = [
    input.model,
    input.promptVersion,
    input.eventId,
    input.language,
    input.passageHash,
  ].join("|");
  const digest = createHash("sha256").update(parts).digest("hex");
  return `${KEY_PREFIX}${digest}`;
}

export interface SynthesisCache {
  get(key: string): Promise<CachedSynthesis | undefined>;
  set(key: string, value: CachedSynthesis): Promise<void>;
}

/**
 * In-process Map backend. Used in dev when Upstash env vars are absent
 * and in unit tests. No TTL — entries live for the process lifetime.
 */
export function createInMemoryCache(): SynthesisCache {
  const store = new Map<string, CachedSynthesis>();
  return {
    async get(key) {
      return store.get(key);
    },
    async set(key, value) {
      store.set(key, value);
    },
  };
}

/**
 * Upstash Redis backend. Used in production. Reads
 * `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from env;
 * throws if either is missing.
 */
export function createUpstashCache(env: NodeJS.ProcessEnv = process.env): SynthesisCache {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "createUpstashCache: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set",
    );
  }
  const redis = new Redis({ url, token });
  return {
    async get(key) {
      const value = await redis.get<CachedSynthesis>(key);
      return value ?? undefined;
    },
    async set(key, value) {
      await redis.set(key, value);
    },
  };
}

/**
 * Backend selection. Used by the route handler at request-time so each
 * cold serverless invocation lands on the right cache.
 */
export function createCache(env: NodeJS.ProcessEnv = process.env): SynthesisCache {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return createUpstashCache(env);
  }
  return createInMemoryCache();
}
