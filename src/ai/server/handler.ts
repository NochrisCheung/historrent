/**
 * Pure synthesis handler (Phase 9). Composes:
 *
 *   cache lookup → if miss → build prompt → DeepSeek → cache write → response
 *
 * Designed so the route file (`src/app/api/synthesise/route.ts`) is a thin
 * shim and every branch is unit-testable here without spinning up Next.js
 * or a network. Dependencies (`cache`, `deepseek`) are injected; the route
 * picks the real or fake variants based on env.
 *
 * Refusal handling: when DeepSeek replies with "passages do not contain
 * enough information," the handler treats that text as a normal synthesis
 * — no detection, no retry. The UI surfaces the model's answer verbatim.
 */

import { z } from "zod";
import type { TCitation, TLiuBangEvent } from "@/data/liu_bang.schema";
import { liuBangCorpus } from "@/data/liu_bang";
import type { Language } from "@/state/uiStore";
import { buildSynthesisPrompt } from "./prompt";
import { cacheKey, type CachedSynthesis, type CacheKeyInput, type SynthesisCache } from "./cache";
import type { DeepSeekClient } from "./deepseek";

export const SynthesiseRequest = z.object({
  /** Event UUID. */
  eventId: z.string().uuid(),
  language: z.enum(["zh-Hans", "zh-Hant"]),
});
export type TSynthesiseRequest = z.infer<typeof SynthesiseRequest>;

export interface SynthesiseResponse {
  /** The model output (or refusal text — handler doesn't distinguish). */
  synthesis: string;
  /** Echoed back so the client can sanity-check. */
  eventId: string;
  language: Language;
  /** Subset of citation metadata the UI needs to render chips + cards. */
  citations: Array<{
    chapter: number;
    paragraph: number;
    label: string;
  }>;
  /** True if served from cache; false if a fresh DeepSeek call was made. */
  cached: boolean;
  promptVersion: string;
  /** ISO-8601 timestamp of when the synthesis was first produced. */
  generatedAt: string;
}

export interface HandlerDependencies {
  cache: SynthesisCache;
  deepseek: DeepSeekClient;
  /** For tests — defaults to `() => new Date().toISOString()`. */
  now?: () => string;
}

export class EventNotFoundError extends Error {
  constructor(eventId: string) {
    super(`No event with id "${eventId}"`);
    this.name = "EventNotFoundError";
  }
}

export interface HandleSynthesiseInput extends TSynthesiseRequest {
  deps: HandlerDependencies;
}

export async function handleSynthesise(input: HandleSynthesiseInput): Promise<SynthesiseResponse> {
  const parsed = SynthesiseRequest.parse({ eventId: input.eventId, language: input.language });
  const event = liuBangCorpus.events.find((e) => e.id === parsed.eventId);
  if (!event) throw new EventNotFoundError(parsed.eventId);

  return runHandler(event, parsed.language, input.deps);
}

async function runHandler(
  event: TLiuBangEvent,
  language: Language,
  deps: HandlerDependencies,
): Promise<SynthesiseResponse> {
  const prompt = buildSynthesisPrompt(event, language);
  const now = deps.now ?? (() => new Date().toISOString());

  const keyInput: CacheKeyInput = {
    model: "deepseek-v4-flash",
    promptVersion: prompt.version,
    eventId: event.id,
    language,
    passageHash: prompt.passageHash,
  };
  const key = cacheKey(keyInput);

  const hit = await deps.cache.get(key);
  if (hit) {
    return buildResponse({
      synthesis: hit.synthesis,
      cached: true,
      event,
      language,
      promptVersion: hit.promptVersion,
      generatedAt: hit.generatedAt,
    });
  }

  const result = await deps.deepseek.chat({ system: prompt.system, user: prompt.user });
  const cached: CachedSynthesis = {
    synthesis: result.content,
    generatedAt: now(),
    model: result.model,
    promptVersion: prompt.version,
  };
  await deps.cache.set(key, cached);

  return buildResponse({
    synthesis: cached.synthesis,
    cached: false,
    event,
    language,
    promptVersion: cached.promptVersion,
    generatedAt: cached.generatedAt,
  });
}

function buildResponse(args: {
  synthesis: string;
  cached: boolean;
  event: TLiuBangEvent;
  language: Language;
  promptVersion: string;
  generatedAt: string;
}): SynthesiseResponse {
  return {
    synthesis: args.synthesis,
    eventId: args.event.id,
    language: args.language,
    citations: args.event.citations.map(citationSummary),
    cached: args.cached,
    promptVersion: args.promptVersion,
    generatedAt: args.generatedAt,
  };
}

function citationSummary(c: TCitation): SynthesiseResponse["citations"][number] {
  return {
    chapter: c.chapter,
    paragraph: c.paragraph,
    label: `Shiji-${c.chapter}-${c.paragraph}`,
  };
}
