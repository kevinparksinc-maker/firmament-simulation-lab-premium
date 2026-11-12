import { afterEach, describe, expect, it, vi } from "vitest";

const config = vi.hoisted(() => ({
  googleAiApiKey: "test-only-key",
  googleAiModel: "test-model",
}));
vi.mock("./_core/env", () => ({ ENV: config }));
import { getSportsAIStatus, invokeLLM } from "./_core/llm";

const messages = [{ role: "user" as const, content: "Judge this chart." }];

afterEach(() => {
  vi.unstubAllGlobals();
  config.googleAiApiKey = "test-only-key";
});

describe("sports Gemini provider", () => {
  it("passes the full request and conversation to Gemini in one provider call", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        responseId: "test",
        modelVersion: "test-model",
        candidates: [
          {
            finishReason: "STOP",
            content: { parts: [{ text: "Sports reading" }] },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetch);
    const evidence = "calculated-result ".repeat(3000);
    const result = await invokeLLM({
      singleAttempt: true,
      max_tokens: 6500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Master sports strategy" },
        { role: "user", content: evidence },
        { role: "assistant", content: "Earlier explanation" },
        { role: "user", content: "Explain the opposition" },
      ],
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.systemInstruction.parts[0].text).toBe("Master sports strategy");
    expect(body.contents[0].parts[0].text).toBe(evidence);
    expect(body.contents.map((entry: { role: string }) => entry.role)).toEqual([
      "user",
      "model",
      "user",
    ]);
    expect(body.generationConfig).toEqual({
      maxOutputTokens: 6500,
      responseMimeType: "application/json",
    });
    expect(result.choices[0].message.content).toBe("Sports reading");
    expect(getSportsAIStatus().provider).toBe("google-gemini");
  });

  it.each([429, 503])(
    "does not retry a sports reasoning request after HTTP %i",
    async status => {
      const fetch = vi.fn().mockResolvedValue({ ok: false, status });
      vi.stubGlobal("fetch", fetch);
      await expect(
        invokeLLM({ messages, singleAttempt: true })
      ).rejects.toThrow(`HTTP ${status}`);
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  );

  it("does not retry a transport failure", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("transport failure"));
    vi.stubGlobal("fetch", fetch);
    await expect(invokeLLM({ messages, singleAttempt: true })).rejects.toThrow(
      "transport failure"
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not publish a truncated reading", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: "MAX_TOKENS",
            content: { parts: [{ text: "Partial answer" }] },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetch);
    await expect(invokeLLM({ messages, singleAttempt: true })).rejects.toThrow(
      "SPORTS_AI_TRUNCATED"
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("gives an actionable error when Gemini is unconfigured", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    config.googleAiApiKey = "";
    await expect(invokeLLM({ messages, singleAttempt: true })).rejects.toThrow(
      "GEMINI_API_KEY"
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
