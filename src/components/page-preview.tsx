import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getPagePreview } from "@/lib/data.functions";
import { toEn, toFa } from "@/lib/aline";

/** Shows the beginning of the matched page content (printed page + book offset). */
export function PagePreview({ book, page }: { book: string; page: string }) {
  const [state, setState] = useState<{ pdfPage: number; text: string | null } | null>(null);
  const load = useServerFn(getPagePreview);

  useEffect(() => {
    let cancelled = false;
    const printed = Number(toEn(page));
    if (!book || !page.trim() || !Number.isFinite(printed)) {
      setState(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await load({ data: { book, page } });
        if (!cancelled) setState(result ?? null);
      } catch {
        if (!cancelled) setState(null);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [book, page, load]);

  if (!state) return null;

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-xs font-bold text-muted-foreground">
        پیش‌نمایش صفحهٔ {toFa(page)} (صفحهٔ {toFa(state.pdfPage)} فایل PDF)
      </p>
      <p className="text-balance-fa mt-2 text-sm leading-7">
        {state.text ? `${state.text}…` : "متنی برای این صفحه پیدا نشد؛ اختلاف شماره صفحه یا بارگذاری کتاب را بررسی کنید."}
      </p>
    </div>
  );
}
