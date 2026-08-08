import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toEn, toFa } from "@/lib/aline";

/** Shows the beginning of the matched page content (printed page + book offset). */
export function PagePreview({ book, page }: { book: string; page: string }) {
  const [state, setState] = useState<{ pdfPage: number; text: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const printed = Number(toEn(page));
    if (!book || !page.trim() || !Number.isFinite(printed)) {
      setState(null);
      return;
    }
    const timer = setTimeout(async () => {
      const { data: bookRow } = await supabase
        .from("books")
        .select("page_offset")
        .eq("name", book)
        .maybeSingle();
      const pdfPage = printed + (bookRow?.page_offset ?? 0);
      const { data: row } = await supabase
        .from("book_pages")
        .select("content")
        .eq("book", book)
        .eq("page", String(pdfPage))
        .maybeSingle();
      if (!cancelled) setState({ pdfPage, text: row?.content?.trim() || null });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [book, page]);

  if (!state) return null;

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-xs font-bold text-muted-foreground">
        پیش‌نمایش صفحهٔ {toFa(page)} (صفحهٔ {toFa(state.pdfPage)} فایل PDF)
      </p>
      <p className="text-balance-fa mt-2 text-sm leading-7">
        {state.text ? `${state.text.slice(0, 150)}…` : "متنی برای این صفحه پیدا نشد؛ اختلاف شماره صفحه یا بارگذاری کتاب را بررسی کنید."}
      </p>
    </div>
  );
}
