import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Phase } from "./aline-prompt.server";

const CreateSessionInput = z.object({
  student_name: z.string().default(""),
  content_type: z.enum(["story", "lesson"]).default("story"),
  book: z.string().nullable().default(null),
  chapter: z.string().nullable().default(null),
  page: z.string().nullable().default(null),
  moral_topic: z.string().nullable().default(null),
});

export const createSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateSessionInput.parse(input))
  .handler(async ({ data }) => {
    const { createServerSupabase } = await import("./supabase.server");
    const supabase = createServerSupabase();
    const { data: row, error } = await supabase
      .from("sessions")
      .insert({ ...data, status: "active" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { sessionId: row.id as string };
  });

const ChatInput = z.object({
  sessionId: z.string().uuid(),
  userMessage: z.string().default(""),
  moodSticker: z.string().nullable().default(null),
  moodReason: z.string().nullable().default(null),
});

export const chat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["OPENROUTER_API_KEY"];
    const { createServerSupabase } = await import("./supabase.server");
    const { buildSystemPrompt, nextPhase } = await import("./aline-prompt.server");
    const { loadPageContent } = await import("./book-page.server");
    const supabase = createServerSupabase();

    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", data.sessionId)
      .single();
    if (sErr || !session) throw new Error("جلسه پیدا نشد.");

    const { data: history } = await supabase
      .from("messages")
      .select("sender, phase, text")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });

    const past = history ?? [];
    const lastAline = [...past].reverse().find((m) => m.sender === "aline");
    const phase: Phase = !lastAline ? "greeting" : nextPhase(lastAline.phase as Phase);

    // Save the mood sticker and the reason the child gave for it.
    const moodUpdate: { mood_sticker?: string; mood_reason?: string } = {};
    if (data.moodSticker && !session.mood_sticker) moodUpdate.mood_sticker = data.moodSticker;
    if (data.moodReason?.trim()) moodUpdate.mood_reason = data.moodReason.trim();
    if (Object.keys(moodUpdate).length > 0) {
      await supabase.from("sessions").update(moodUpdate).eq("id", data.sessionId);
      Object.assign(session, moodUpdate);
    }

    // Load the configured page of the configured book (printed page + book offset).
    // Stories may also reference a page so Aline can weave learning content in.
    let pageContent: string | null = null;
    if (phase === "content" && session.book && session.page) {
      pageContent = await loadPageContent(supabase, session.book, session.page);
    }

    if (data.userMessage.trim()) {
      await supabase.from("messages").insert({
        session_id: data.sessionId,
        sender: "child",
        phase,
        text: data.userMessage.trim(),
      });
    }

    if (!apiKey) {
      throw new Error("کلید OpenRouter تنظیم نشده است.");
    }

    const messages = [
      { role: "system" as const, content: buildSystemPrompt(session, phase, pageContent) },
      ...past.map((m) => ({
        role: (m.sender === "child" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      })),
      ...(data.userMessage.trim()
        ? [{ role: "user" as const, content: data.userMessage.trim() }]
        : [{ role: "user" as const, content: "شروع کن." }]),
    ];

    let res: Response;
    try {
      res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.8,
        }),
        // Never let the child stare at a spinner forever.
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      console.error("[aline.chat] request failed", {
        sessionId: data.sessionId,
        phase,
        error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      });
      throw new Error("الین الان نتونست جواب بده، دوباره امتحان کن.");
    }

    if (!res.ok) {
      const body = await res.text();
      console.error("[aline.chat] AI error response", {
        sessionId: data.sessionId,
        phase,
        status: res.status,
        body: body.slice(0, 500),
      });
      if (res.status === 429) throw new Error("کمی شلوغ است، چند لحظه بعد دوباره امتحان کن.");
      throw new Error("الین الان نتونست جواب بده، دوباره امتحان کن.");
    }

    const payload = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    let message = raw;
    let question = "";
    try {
      const parsed = JSON.parse(raw) as { message?: string; question?: string };
      message = parsed.message ?? raw;
      question = parsed.question ?? "";
    } catch {
      // keep raw text
    }

    await supabase.from("messages").insert({
      session_id: data.sessionId,
      sender: "aline",
      phase,
      text: [message, question].filter(Boolean).join("\n\n"),
    });

    if (phase === "content") {
      await supabase.from("sessions").update({ status: "content" }).eq("id", data.sessionId);
    }

    return { phase, message, question };
  });

const QuizInput = z.object({ sessionId: z.string().uuid() });

/** Builds a 3-question multiple-choice quiz from the content of this session. */
export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => QuizInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["OPENROUTER_API_KEY"];
    if (!apiKey) throw new Error("کلید OpenRouter تنظیم نشده است.");
    const { createServerSupabase } = await import("./supabase.server");
    const { buildQuizPrompt } = await import("./aline-prompt.server");
    const { loadPageContent } = await import("./book-page.server");
    const supabase = createServerSupabase();

    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", data.sessionId)
      .single();
    if (!session) throw new Error("جلسه پیدا نشد.");

    const { data: history } = await supabase
      .from("messages")
      .select("sender, phase, text")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });

    const contentText = (history ?? [])
      .filter((m) => m.phase === "content" && m.sender === "aline")
      .map((m) => m.text)
      .join("\n\n")
      .trim();
    if (!contentText) throw new Error("هنوز محتوایی برای آزمون ساخته نشده است.");

    const pageContent =
      session.book && session.page
        ? await loadPageContent(supabase, session.book, session.page)
        : null;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "system", content: buildQuizPrompt(session, contentText, pageContent) }],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("کمی شلوغ است، چند لحظه بعد دوباره امتحان کن.");
      throw new Error(`ساخت آزمون ممکن نشد (${res.status}).`);
    }

    const payload = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    let questions: { question: string; options: string[]; correct: number }[] = [];
    try {
      const parsed = JSON.parse(raw) as {
        questions?: { question?: string; options?: string[]; correct?: number }[];
      };
      questions = (parsed.questions ?? [])
        .filter((q) => q.question && Array.isArray(q.options) && q.options.length >= 2)
        .map((q) => ({
          question: q.question!,
          options: q.options!,
          correct: Math.min(Math.max(Number(q.correct) || 0, 0), q.options!.length - 1),
        }))
        .slice(0, 5);
    } catch {
      questions = [];
    }
    if (questions.length === 0) throw new Error("ساخت آزمون ممکن نشد.");

    const topic =
      session.content_type === "lesson"
        ? `${session.book ?? "درس"} — صفحهٔ ${session.page ?? ""}`.trim()
        : (session.moral_topic ?? "داستان اخلاقی");

    return { questions, topic, type: session.content_type === "lesson" ? "درس" : "داستان" };
  });


const ExtractBookInput = z.object({
  path: z.string().min(1),
  book: z.string().min(1),
  chapter: z.string().default("۱"),
});

/** Reads an uploaded textbook PDF from storage and stores its text page by page. */
export const extractBook = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExtractBookInput.parse(input))
  .handler(async ({ data }) => {
    const { createServerSupabase } = await import("./supabase.server");
    const supabase = createServerSupabase();

    const { data: file, error } = await supabase.storage.from("textbooks").download(data.path);
    if (error || !file) throw new Error(error?.message ?? "فایل پیدا نشد.");

    const { extractPdfPages } = await import("./pdf-text.server");
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pages = await extractPdfPages(buffer);

    const rows = pages.map((content, i) => ({
      book: data.book,
      chapter: data.chapter,
      page: String(i + 1),
      content: (content ?? "").trim(),
    }));

    const { error: insertError } = await supabase
      .from("book_pages")
      .upsert(rows, { onConflict: "book,chapter,page" });
    if (insertError) throw new Error(insertError.message);

    return { pages: rows.length };
  });
