/**
 * DeepSeek client for non-streaming chat completions (Phase 9).
 *
 * Endpoint: `POST https://api.deepseek.com/chat/completions`. We post a
 * `{ model, messages, stream: false }` body and read the JSON response.
 * No streaming, no async batch mode, no tool calls — just a straight
 * request → text response that the handler caches and returns.
 *
 * `createDeepSeekClient` is the production client; `createFakeDeepSeekClient`
 * returns a deterministic synthesis without any network call. The route
 * picks one based on `DEEPSEEK_API_KEY` presence (see route.ts).
 */

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-v4-flash";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export interface DeepSeekRequest {
  system: string;
  user: string;
}

export interface DeepSeekResponse {
  /** The verbatim model output. */
  content: string;
  /** Echo back the model that produced this output (for diagnostics + cache). */
  model: string;
}

export interface DeepSeekClient {
  chat(req: DeepSeekRequest): Promise<DeepSeekResponse>;
}

/** Network failure (e.g. fetch threw). */
export class DeepSeekNetworkError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DeepSeekNetworkError";
  }
}

/** Non-200 response from DeepSeek (4xx/5xx, but not 429). */
export class DeepSeekHttpError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`DeepSeek returned ${status}: ${body.slice(0, 200)}`);
    this.name = "DeepSeekHttpError";
  }
}

/** Rate-limited (HTTP 429). */
export class DeepSeekRateLimitError extends Error {
  constructor(public retryAfterSeconds?: number) {
    super(
      retryAfterSeconds !== undefined
        ? `DeepSeek rate-limited; retry after ${retryAfterSeconds}s`
        : "DeepSeek rate-limited",
    );
    this.name = "DeepSeekRateLimitError";
  }
}

interface CreateOptions {
  apiKey: string;
  model?: string;
  /** Override `fetch` for unit tests. Defaults to global `fetch`. */
  fetchImpl?: typeof fetch;
}

/**
 * Real DeepSeek client. Reads `DEEPSEEK_API_KEY` from env, posts a
 * non-streaming chat completion, and returns the assistant message.
 */
export function createDeepSeekClient(options: CreateOptions): DeepSeekClient {
  const { apiKey, model = DEFAULT_MODEL, fetchImpl = fetch } = options;
  if (!apiKey) {
    throw new Error("createDeepSeekClient: apiKey is required");
  }

  return {
    async chat({ system, user }) {
      const messages: ChatMessage[] = [
        { role: "system", content: system },
        { role: "user", content: user },
      ];

      let response: Response;
      try {
        response = await fetchImpl(DEEPSEEK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, stream: false }),
        });
      } catch (cause) {
        throw new DeepSeekNetworkError("DeepSeek fetch failed", { cause });
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const seconds = retryAfter ? Number.parseInt(retryAfter, 10) : undefined;
        throw new DeepSeekRateLimitError(Number.isFinite(seconds) ? seconds : undefined);
      }
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new DeepSeekHttpError(response.status, body);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        model?: string;
      };
      const content = json.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.length === 0) {
        throw new DeepSeekHttpError(
          response.status,
          `Malformed response: ${JSON.stringify(json).slice(0, 200)}`,
        );
      }

      return { content, model: json.model ?? model };
    },
  };
}

/**
 * Fake client for local dev (no API key) and unit tests.
 * Returns a deterministic synthesis based on the user prompt's hash so
 * the same input always yields the same output. Includes a synthetic
 * `[Shiji-N-M]` label so downstream chip parsing has something to find.
 */
export function createFakeDeepSeekClient(model = DEFAULT_MODEL): DeepSeekClient {
  return {
    async chat({ user }) {
      // Pull a "Shiji-N-M" tag from the user prompt so the stub mentions a
      // real citation tag for this event (chip parsing has something to grab).
      const tag = user.match(/\[Shiji-\d+-\d+\]/)?.[0] ?? "[Shiji-8-1]";
      const content = `（开发存根）此为开发模式下的合成占位文本，供 UI 调试使用 ${tag}。设置 DEEPSEEK_API_KEY 环境变量以接入真实模型。`;
      return { content, model };
    },
  };
}
