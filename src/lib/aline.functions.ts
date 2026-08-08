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
});

export const chat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["OPENROUTER_API_KEY"];
    const { createServerSupabase } = await import("./supabase.server");
    const { buildSystemPrompt, nextPhase } = await import("./aline-prompt.server");
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

    // Save mood when the child answers the greeting question.
    if (data.moodSticker && !session.mood_sticker) {
      await supabase
        .from("sessions")
        .update({ mood_sticker: data.moodSticker, mood_reason: data.userMessage || null })
        .eq("id", data.sessionId);
      session.mood_sticker = data.moodSticker;
      session.mood_reason = data.userMessage || null;
    }

    // Only load the configured chapter/page of the configured book.
    let pageContent: string | null = null;
    if (phase === "content" && session.book && session.chapter && session.page) {
      const { data: bookPage } = await supabase
        .from("book_pages")
        .select("content")
        .eq("book", session.book)
        .eq("chapter", session.chapter)
        .eq("page", session.page)
        .maybeSingle();
      pageContent = bookPage?.content ?? null;
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

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("کمی شلوغ است، چند لحظه بعد دوباره امتحان کن.");
      throw new Error(`خطای سرویس هوش مصنوعی (${res.status}): ${body.slice(0, 200)}`);
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

    const { extractText, getDocumentProxy } = await import("unpdf");
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(text) ? text : [text];

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
