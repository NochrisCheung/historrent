/**
 * POST /api/synthesise
 *
 * Thin shim around `handleSynthesise()` (Phase 9). Wires deps once per
 * process: cache backend selected by `createCache()` (Upstash if env
 * vars present, in-memory `Map` otherwise); DeepSeek client is the
 * real fetch client when `DEEPSEEK_API_KEY` is set, else a deterministic
 * fake so dev works without an API key.
 *
 * Error mapping:
 *  - Zod validation failure → 400
 *  - Unknown event id → 404
 *  - DeepSeek rate-limit → 429 (with `Retry-After` header)
 *  - DeepSeek HTTP / network failure → 502
 *  - Anything else → 500
 */

import { handleSynthesise, EventNotFoundError } from "@/ai/server/handler";
import { createCache } from "@/ai/server/cache";
import {
  createDeepSeekClient,
  createFakeDeepSeekClient,
  DeepSeekHttpError,
  DeepSeekNetworkError,
  DeepSeekRateLimitError,
} from "@/ai/server/deepseek";
import { ZodError } from "zod";

export const runtime = "nodejs";

const cache = createCache();
const deepseek = process.env.DEEPSEEK_API_KEY
  ? createDeepSeekClient({ apiKey: process.env.DEEPSEEK_API_KEY })
  : createFakeDeepSeekClient();

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Body must be an object" }, { status: 400 });
  }
  const { eventId, language } = body as { eventId?: unknown; language?: unknown };

  try {
    const result = await handleSynthesise({
      eventId: eventId as string,
      language: language as "zh-Hans" | "zh-Hant",
      deps: { cache, deepseek },
    });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return Response.json({ error: "Invalid request", issues: err.issues }, { status: 400 });
    }
    if (err instanceof EventNotFoundError) {
      return Response.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof DeepSeekRateLimitError) {
      const headers = new Headers();
      if (err.retryAfterSeconds !== undefined) {
        headers.set("Retry-After", String(err.retryAfterSeconds));
      }
      return Response.json({ error: err.message }, { status: 429, headers });
    }
    if (err instanceof DeepSeekHttpError || err instanceof DeepSeekNetworkError) {
      return Response.json({ error: err.message }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
