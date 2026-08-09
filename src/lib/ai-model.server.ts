/**
 * Model + transport used for all Aline AI calls.
 * Uses the built-in Lovable AI Gateway, so no third-party API credit is needed.
 */
export const AI_MODEL = "openai/gpt-5.6-sol";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Calls the AI gateway with a JSON-object response format. */
export async function callAi(
  messages: ChatMessage[],
  opts: { temperature?: number } = {},
): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("سرویس هوش مصنوعی در دسترس نیست.");

  return fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      // GPT-5.6 rejects function/tool requests with reasoning enabled.
      reasoning_effort: "none",
      // The caller's system prompt already specifies the JSON shape, so no
      // extra reminder message is sent.
      messages,
      response_format: { type: "json_object" },
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    }),
    // Never let the child stare at a spinner forever.
    signal: AbortSignal.timeout(30_000),
  });
}
