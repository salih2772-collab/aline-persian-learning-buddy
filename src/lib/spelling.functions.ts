import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) => {
    const text = data.text.trim();
    if (text.length < 2) return { stored: 0 };


    const { buildSpellingPrompt, parseSpellingIssues } = await import("./spelling.server");
    const supabase = context.supabase;

    const { data: session } = await supabase
      .from("sessions")
      .select("student_name")
      .eq("id", data.sessionId)
      .single();

    const { callAi } = await import("./ai-model.server");
    let res: Response;
    try {
      res = await callAi(
        [
          { role: "system", content: buildSpellingPrompt() },
          { role: "user", content: text },
        ],
        { temperature: 0 },
      );
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
        parent_id: context.userId,
        session_id: data.sessionId,
        child_name: session?.student_name ?? "",
        ...i,
      })),
    );
    if (error) return { stored: 0 };
    return { stored: issues.length };
  });
