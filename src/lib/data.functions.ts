import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Book upload status + page offsets for the parent uploader screen. */
export const getBookStats = createServerFn({ method: "GET" }).handler(async () => {
  const { createServerSupabase } = await import("./supabase.server");
  const supabase = createServerSupabase();
  const [{ data: pages }, { data: books }] = await Promise.all([
    supabase.from("book_pages").select("book"),
    supabase.from("books").select("name, page_offset"),
  ]);
  const counts: Record<string, number> = {};
  for (const row of pages ?? []) counts[row.book] = (counts[row.book] ?? 0) + 1;
  const offsets: Record<string, number> = {};
  for (const row of books ?? []) offsets[row.name] = row.page_offset;
  return { counts, offsets };
});

export const saveBookOffset = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ book: z.string().min(1).max(120), offset: z.number().int().min(-500).max(500) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createServerSupabase } = await import("./supabase.server");
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("books")
      .upsert({ name: data.book, page_offset: data.offset }, { onConflict: "name" });
    if (error) throw new Error("اختلاف صفحه ذخیره نشد.");
    return { ok: true };
  });

/** Creates a one-time signed upload target in the private textbooks bucket. */
export const createTextbookUploadUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ fileName: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createServerSupabase } = await import("./supabase.server");
    const supabase = createServerSupabase();
    const safe = data.fileName.replace(/[^\w.\-]+/g, "_").slice(-100);
    const path = `${Date.now()}-${safe}`;
    const { data: signed, error } = await supabase.storage
      .from("textbooks")
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error("آماده‌سازی بارگذاری ناموفق بود.");
    return { path: signed.path, token: signed.token };
  });

/** First characters of the matched page, for the session setup preview. */
export const getPagePreview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ book: z.string().min(1).max(120), page: z.string().min(1).max(10) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createServerSupabase } = await import("./supabase.server");
    const { toEn } = await import("./aline");
    const supabase = createServerSupabase();
    const printed = Number(toEn(data.page));
    if (!Number.isFinite(printed)) return null;
    const { data: bookRow } = await supabase
      .from("books")
      .select("page_offset")
      .eq("name", data.book)
      .maybeSingle();
    const pdfPage = printed + (bookRow?.page_offset ?? 0);
    const { data: row } = await supabase
      .from("book_pages")
      .select("content")
      .eq("book", data.book)
      .eq("page", String(pdfPage))
      .maybeSingle();
    return { pdfPage, text: row?.content?.trim().slice(0, 150) || null };
  });

/** Aggregated parent dashboard data. The child's own words stay private. */
export const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const { createServerSupabase } = await import("./supabase.server");
  const supabase = createServerSupabase();
  const [{ data: moods }, { data: done }, { data: spelling }] = await Promise.all([
    supabase
      .from("sessions")
      // mood_reason is intentionally NOT fetched: the child's own words stay private.
      .select("id, student_name, mood_sticker, created_at")
      .not("mood_sticker", "is", null)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("sessions")
      .select(
        "id, content_type, moral_topic, book, page, mood_sticker, quiz_correct, quiz_total, completed_at, created_at",
      )
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(8),
    supabase
      .from("spelling_errors")
      .select("id, child_name, written_form, correct_form, error_type, created_at")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);
  return { moods: moods ?? [], done: done ?? [], spelling: spelling ?? [] };
});
