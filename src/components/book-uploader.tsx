import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractBook } from "@/lib/aline.functions";
import { useServerFn } from "@tanstack/react-start";
import { BOOKS, toEn, toFa } from "@/lib/aline";

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring";

/** Upload a full textbook PDF once per book; its pages are stored for Aline to teach from. */
export function BookUploader({ book: initialBook }: { book: string }) {
  const [book, setBook] = useState(initialBook);
  const [file, setFile] = useState<File | null>(null);
  const [offset, setOffset] = useState("0");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [offsets, setOffsets] = useState<Record<string, number>>({});
  const run = useServerFn(extractBook);

  const refresh = useCallback(async () => {
    const [{ data }, { data: bookRows }] = await Promise.all([
      supabase.from("book_pages").select("book"),
      supabase.from("books").select("name, page_offset"),
    ]);
    const next: Record<string, number> = {};
    for (const row of data ?? []) next[row.book] = (next[row.book] ?? 0) + 1;
    setCounts(next);
    const offs: Record<string, number> = {};
    for (const row of bookRows ?? []) offs[row.name] = row.page_offset;
    setOffsets(offs);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setOffset(String(offsets[book] ?? 0));
  }, [book, offsets]);

  async function saveOffset() {
    const value = Number(toEn(offset)) || 0;
    const { error: offErr } = await supabase
      .from("books")
      .upsert({ name: book, page_offset: value }, { onConflict: "name" });
    if (offErr) throw new Error(offErr.message);
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setStatus(null);
    setError(null);
    try {
      await saveOffset();
      const path = `${Date.now()}-${encodeURIComponent(file.name)}`;
      const { error: upErr } = await supabase.storage.from("textbooks").upload(path, file, {
        contentType: "application/pdf",
      });
      if (upErr) throw new Error(upErr.message);
      const result = await run({ data: { path, book } });
      setStatus(`کتاب ${book} بارگذاری شد — ${toFa(result.pages)} صفحه استخراج شد`);
      setFile(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }


  return (
    <form onSubmit={upload} className="card-soft mt-6 grid gap-4 p-5 sm:p-7">
      <div>
        <h2 className="text-lg font-black">بارگذاری فایل PDF کتاب</h2>
        <p className="text-balance-fa mt-1 text-sm text-muted-foreground">
          یک‌بار برای هر کتاب کافی است؛ کل کتاب بارگذاری می‌شود و شمارهٔ صفحه‌ها از خود فایل PDF خوانده می‌شود.
        </p>
      </div>

      <ul className="grid gap-2">
        {BOOKS.map((b) => {
          const uploaded = (counts[b] ?? 0) > 0;
          return (
            <li
              key={b}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm"
            >
              <span className="font-bold">{b}</span>
              <span className={uploaded ? "font-bold text-success" : "text-muted-foreground"}>
                {uploaded ? `بارگذاری شده ✓ (${toFa(counts[b] ?? 0)} صفحه)` : "هنوز بارگذاری نشده"}
                {offsets[b] ? ` — اختلاف صفحه: ${toFa(offsets[b] ?? 0)}` : ""}
              </span>
            </li>
          );
        })}
      </ul>

      <label className="grid gap-2">
        <span className="text-sm font-bold">کتاب</span>
        <select className={fieldClass} value={book} onChange={(e) => setBook(e.target.value)}>
          {BOOKS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-bold">فایل PDF</span>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={fieldClass}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-bold">اختلاف شماره صفحه</span>
        <input
          className={fieldClass}
          value={offset}
          onChange={(e) => setOffset(e.target.value)}
          inputMode="numeric"
          placeholder="۶"
        />
        <span className="text-xs text-muted-foreground">
          اگر صفحه ۱ کتاب، صفحه ۷ فایل PDF است، اینجا ۶ بنویسید
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!file || busy}
          className="rounded-full bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground disabled:opacity-50"
        >
          {busy ? "در حال پردازش..." : "بارگذاری و استخراج متن"}
        </button>
        {status ? <span className="text-sm font-bold text-success">{status}</span> : null}
        {error ? <span className="text-sm font-bold text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
