import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  singleAttempt?: boolean;
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const assertApiKey = () => {
  if (!ENV.googleAiApiKey) {
    throw new Error("SPORTS_AI_NOT_CONFIGURED: Set GEMINI_API_KEY in the Render service environment.");
  }
};

const RETRY_MAX_RETRIES = 1;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 2_000;

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

const sleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
};

// Equal-jitter exponential backoff. The cap/2 floor guarantees a minimum
// delay so a misbehaving caller loop slows down instead of hammering the
// upstream while it keeps returning errors.
const computeBackoffDelay = (
  attempt: number,
  retryAfterMs?: number
): number => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};

// Retries non-2xx responses and network errors with exponential backoff, then
// returns the final Response so callers keep their existing error handling.
const fetchWithBackoff = async (
  url: string,
  init: FetchInit
): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || (response.status < 500 && response.status !== 429) || attempt === RETRY_MAX_RETRIES) {
        return response;
      }

      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
        // Body already settled; nothing to clean up.
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (init.signal?.aborted || attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("LLM request failed after exhausting retries");
};

export function getSportsAIStatus() {
  return { configured: Boolean(ENV.googleAiApiKey), provider: ENV.googleAiApiKey ? "google-gemini" : "unconfigured" };
}

/** Gemini bridge retaining the existing normalized chat completion shape. */
async function invokeGemini(params: InvokeParams): Promise<InvokeResult> {
  const toText = (content: Message["content"]): string =>
    (Array.isArray(content) ? content : [content]).map(part =>
      typeof part === "string" ? part : part.type === "text" ? part.text : ""
    ).join("\n");
  const systemText = params.messages.filter(m => m.role === "system").map(m => toText(m.content)).join("\n\n");
  const contents = params.messages.filter(m => m.role === "user" || m.role === "assistant").map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: toText(m.content) }],
  }));
  if (!contents.length) throw new Error("SPORTS_AI_EMPTY_MESSAGES");
  const model = ENV.googleAiModel;
  const format = params.responseFormat ?? params.response_format;
  const jsonMode = format?.type === "json_object" || format?.type === "json_schema" || !!(params.outputSchema ?? params.output_schema);
  const send = params.singleAttempt ? fetch : fetchWithBackoff;
  const response = await send(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      ...(params.singleAttempt ? { redirect: "error" } : {}),
      signal: AbortSignal.timeout(120_000),
      headers: { "content-type": "application/json", "x-goog-api-key": ENV.googleAiApiKey },
      body: JSON.stringify({
        ...(systemText ? { systemInstruction: { parts: [{ text: systemText }] } } : {}),
        contents,
        generationConfig: {
          maxOutputTokens: params.max_tokens ?? params.maxTokens ?? 6500,
          ...(jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );
  if (!response.ok) throw new Error(`SPORTS_AI_PROVIDER_ERROR: Google Gemini returned HTTP ${response.status}. Check key, model and quota.`);
  const data = await response.json() as any;
  const candidate = data.candidates?.[0];
  const content = (candidate?.content?.parts ?? []).filter((part: any) => typeof part.text === "string").map((part: any) => part.text).join("\n");
  if (!content.trim()) throw new Error("SPORTS_AI_EMPTY_RESPONSE: Gemini returned no text.");
  if (candidate?.finishReason === "MAX_TOKENS") throw new Error("SPORTS_AI_TRUNCATED: Gemini reached its output limit.");
  return {
    id: data.responseId ?? "gemini-response",
    created: Math.floor(Date.now() / 1000),
    model: data.modelVersion ?? model,
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: candidate?.finishReason ?? "stop" }],
    ...(data.usageMetadata ? { usage: {
      prompt_tokens: data.usageMetadata.promptTokenCount ?? 0,
      completion_tokens: data.usageMetadata.candidatesTokenCount ?? 0,
      total_tokens: data.usageMetadata.totalTokenCount ?? 0,
    } } : {}),
  };
}

/** Only Google Gemini handles AI reasoning. No second-provider fallback. */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();
  return invokeGemini(params);
}

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: string;
  data: ModelInfo[];
};

/** Lists available Google models; never contacts another AI provider. */
export async function listLLMModels(): Promise<ModelsResponse> {
  assertApiKey();
  const response = await fetchWithBackoff("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", {
    headers: { "x-goog-api-key": ENV.googleAiApiKey },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`SPORTS_AI_MODELS_ERROR: Google returned HTTP ${response.status}.`);
  const data = await response.json() as { models?: Array<{ name: string }> };
  return { object: "list", data: (data.models ?? []).map(model => ({
    id: model.name.replace(/^models\//, ""), object: "model", created: 0, owned_by: "google",
  })) };
}
