/**
 * Frontend caller for `/api/synthesise` (Phase 9).
 *
 * No knowledge of DeepSeek — only talks to our own route. Returns the
 * decoded JSON on success, throws a typed error otherwise. The
 * `<DetailPanel>` "show synthesis" button consumes this.
 */

import type { Language } from "@/state/uiStore";

export interface SynthesisCitation {
  chapter: number;
  paragraph: number;
  /** `Shiji-{chapter}-{paragraph}` — matches the chip refs in the synthesis. */
  label: string;
}

export interface SynthesisResult {
  synthesis: string;
  eventId: string;
  language: Language;
  citations: SynthesisCitation[];
  cached: boolean;
  promptVersion: string;
  generatedAt: string;
}

export class SynthesisRequestError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(`Synthesis request failed: HTTP ${status}`);
    this.name = "SynthesisRequestError";
  }
}

export interface SynthesiseOptions {
  /** Override `fetch` for tests. */
  fetchImpl?: typeof fetch;
  /** Override the route URL. Defaults to `/api/synthesise`. */
  endpoint?: string;
}

export async function synthesise(
  eventId: string,
  language: Language,
  options: SynthesiseOptions = {},
): Promise<SynthesisResult> {
  const { fetchImpl = fetch, endpoint = "/api/synthesise" } = options;
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, language }),
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new SynthesisRequestError(response.status, detail);
  }

  return (await response.json()) as SynthesisResult;
}
