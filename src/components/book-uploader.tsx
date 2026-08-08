import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractBook } from "@/lib/aline.functions";
import { useServerFn } from "@tanstack/react-start";

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring";

/** Upload a textbook PDF once per book; its pages are stored for Aline to teach from. */
export function BookUploader({ book }: { book: string }) {
  const [chapter, setChapter] = useState("۱");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const run = useServerFn(extractBook);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const path = `${Date.now()}-${encodeURIComponent(file.name)}`;
      const { error } = await supabase.storage.from("textbooks").upload(path, file, {
        contentType: "application/pdf",
      });
      if (error) throw new Error(error.message);
      const result = await run({ data: { path, book, chapter } });
      setStatus(`${result.pages} صفحه از این کتاب ذخیره شد ✓`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "بارگذاری ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="card-soft mt-6 grid gap-4 p-5 sm:p-7">
      <div>
        <h2 className="text-lg font-black">بارگذاری فایل PDF کتاب</h2>
        <p className="text-balance-fa mt-1 text-sm text-muted-foreground">
          یک‌بار برای هر کتاب انجام دهید تا الین بتواند از متن همان صفحه‌ها درس بدهد. کتاب انتخاب‌شده: {book}
        </p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-bold">فصل / درس</span>
        <input className={fieldClass} value={chapter} onChange={(e) => setChapter(e.target.value)} />
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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!file || busy}
          className="rounded-full bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground disabled:opacity-50"
        >
          {busy ? "در حال پردازش..." : "بارگذاری و استخراج متن"}
        </button>
        {status ? <span className="text-sm font-bold">{status}</span> : null}
      </div>
    </form>
  );
}
