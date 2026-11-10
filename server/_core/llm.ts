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

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

const assertApiKey = () => {
  if (!ENV.googleAiApiKey && !ENV.anthropicApiKey && !ENV.forgeApiKey) {
    throw new Error("SPORTS_AI_NOT_CONFIGURED: Set GEMINI_API_KEY or ANTHROPIC_API_KEY in the service environment to enable full sports readings.");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

const RETRY_MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 30_000;

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
  return { configured: Boolean(ENV.googleAiApiKey || ENV.anthropicApiKey || ENV.forgeApiKey), provider: ENV.googleAiApiKey ? "google-gemini" : ENV.anthropicApiKey ? "anthropic" : ENV.forgeApiKey ? "built-in-forge" : "unconfigured" };
}

async function invokeAnthropic(params: InvokeParams): Promise<InvokeResult> {
  const text = (content: Message["content"]) => typeof content === "string" ? content :
    (Array.isArray(content) ? content : [content]).map(part => typeof part === "string" ? part : "type" in part && part.type === "text" ? part.text : "").join("\n");
  const response = await fetchWithBackoff("https://api.anthropic.com/v1/messages", {
    method: "POST", signal: AbortSignal.timeout(120_000),
    headers: { "content-type": "application/json", "x-api-key": ENV.anthropicApiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: params.model ?? ENV.anthropicModel,
      max_tokens: params.max_tokens ?? params.maxTokens ?? 6500,
      system: params.messages.filter(message => message.role === "system").map(message => text(message.content)).join("\n\n"),
      messages: params.messages.filter(message => message.role === "user" || message.role === "assistant").map(message => ({ role: message.role, content: text(message.content) })),
    }),
  });
  if (!response.ok) throw new Error(`SPORTS_AI_PROVIDER_ERROR: Anthropic returned HTTP ${response.status}. Check the configured key, account balance, and model.`);
  const data = await response.json() as any;
  if (data.stop_reason === "max_tokens") throw new Error("SPORTS_AI_TRUNCATED: Provider reached its output limit before finishing. No incomplete reading was published.");
  return { id: data.id, created: Math.floor(Date.now()/1000), model: data.model, choices: [{ index:0, message: { role: "assistant", content: (data.content ?? []).filter((part: any) => part.type === "text").map((part: any) => part.text).join("\n") }, finish_reason:"stop" }] };
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
  const model = params.model ?? ENV.googleAiModel;
  const format = params.responseFormat ?? params.response_format;
  const jsonMode = format?.type === "json_object" || format?.type === "json_schema" || !!(params.outputSchema ?? params.output_schema);
  const response = await fetchWithBackoff(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
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

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();
  if (ENV.googleAiApiKey) return invokeGemini(params);
  if (ENV.anthropicApiKey) return invokeAnthropic(params);

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens,
  } = params;

  const payload: Record<string, unknown> = {
    messages: messages.map(normalizeMessage),
  };

  if (model) {
    payload.model = model;
  }

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }

  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
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

export async function listLLMModels(): Promise<ModelsResponse> {
  assertApiKey();

  const url = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/models`
    : "https://forge.manus.im/v1/models";

  const response = await fetchWithBackoff(url, {
    headers: { authorization: `Bearer ${ENV.forgeApiKey}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `List LLM models failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as ModelsResponse;
}
