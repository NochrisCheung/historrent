/**
 * DeepSeek prompt builder for source synthesis (Phase 9).
 *
 * Given a single Liu Bang event and a target language, produces the
 * `{ system, user, version, passageHash }` payload that the handler
 * passes to the DeepSeek client. The system prompt is verbatim per
 * implementation_plan §3.7. The user prompt assembles:
 *
 *  - the event name (in the requested script)
 *  - the event date (rendered via `formatYear`)
 *  - each citation as `[Shiji-{chapter}-{paragraph}] {citation.text}`,
 *    joined by blank lines, in the order they appear on the event
 *  - a closing instruction line + an explicit "respond in Hans/Hant" hint
 *
 * `passageHash` = SHA-256 of `citation.text` values concatenated in
 * citation order. The handler folds this into the cache key so that any
 * curator edit of the passage text invalidates only THAT event's cache,
 * never others'.
 *
 * `version` is bumped manually when the system or user template changes
 * meaningfully — bumping invalidates every cache that mentions the old
 * version.
 */

import { createHash } from "node:crypto";
import type { TLiuBangEvent } from "@/data/liu_bang.schema";
import type { Language } from "@/state/uiStore";
import { centralYear } from "@/shared/date/centralYear";
import { formatYear } from "@/shared/date/bce";

/** Bumping invalidates every cache entry tagged with the old version. */
export const PROMPT_VERSION = "v1";

export const SYSTEM_PROMPT = `You are a careful, source-grounded historical assistant. You answer ONLY from the source passages provided. You DO NOT invent dates, names, places, or causes. Every claim in your answer must cite the source passage by its bracketed reference. If the provided passages do not contain enough information to answer, you say so explicitly. Your answers are in Modern Standard Chinese (Simplified or Traditional, matching the user's preference).`;

export interface SynthesisPrompt {
  /** The system prompt (constant, language-agnostic). */
  system: string;
  /** The user prompt (event-specific, with passages and language hint). */
  user: string;
  /** Prompt template version — folded into the cache key. */
  version: string;
  /** SHA-256 of the concatenated citation passages — also folded into the cache key. */
  passageHash: string;
}

export function buildSynthesisPrompt(event: TLiuBangEvent, language: Language): SynthesisPrompt {
  const name = language === "zh-Hans" ? event.name.zhHans : event.name.zhHant;
  const date = formatYear(centralYear(event.date), language);

  const passageBlock = event.citations
    .map((c) => `[Shiji-${c.chapter}-${c.paragraph}] ${c.text}`)
    .join("\n\n");

  const langHint = language === "zh-Hans" ? "请用简体中文回答。" : "請用繁體中文回答。";

  const user = [
    `事件：${name}（约 ${date}）`,
    "",
    "来源段落：",
    passageBlock,
    "",
    `请用约 80–120 个汉字综合上述来源段落对该事件的记述。每个论断必须用方括号引用对应的段落（例如 [Shiji-8-22]）。如果段落信息不足以回答某个方面，请说明。${langHint}`,
  ].join("\n");

  const passageHash = createHash("sha256")
    .update(event.citations.map((c) => c.text).join("\n"))
    .digest("hex");

  return {
    system: SYSTEM_PROMPT,
    user,
    version: PROMPT_VERSION,
    passageHash,
  };
}
