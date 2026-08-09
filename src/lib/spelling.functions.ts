import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AnalyzeInput = z.object({
  sessionId: z.string().uuid(),
  text: z.string().default(""),
});

/**
 * Silently analyses a child's message for writing issues and stores them.
 * Never returns anything shown to the child.
 */
export const analyzeSpelling = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }) => {
    const text = data.text.trim();
    if (text.length < 2) return { stored: 0 };

    const apiKey = process.env["OPENROUTER_API_KEY"];
    if (!apiKey) return { stored: 0 };

    const { createServerSupabase } = await import("./supabase.server");
    const { buildSpellingPrompt, parseSpellingIssues } = await import("./spelling.server");
    const supabase = createServerSupabase();

    const { data: session } = await supabase
      .from("sessions")
      .select("student_name")
      .eq("id", data.sessionId)
      .single();

    const { AI_MODEL } = await import("./ai-model.server");
    let res: Response;
    try {
      res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: "system", content: buildSpellingPrompt() },
            { role: "user", content: text },
          ],
          response_format: { type: "json_object" },
          temperature: 0,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      console.error("[spelling.analyze] request failed", {
        sessionId: data.sessionId,
        error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      });
      return { stored: 0 };
    }
    if (!res.ok) {
      console.error("[spelling.analyze] AI error response", { status: res.status });
      return { stored: 0 };
    }

    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const issues = parseSpellingIssues(payload.choices?.[0]?.message?.content ?? "");
    if (issues.length === 0) return { stored: 0 };

    const { error } = await supabase.from("spelling_errors").insert(
      issues.map((i) => ({
        session_id: data.sessionId,
        child_name: session?.student_name ?? "",
        ...i,
      })),
    );
    if (error) return { stored: 0 };
    return { stored: issues.length };
  });
