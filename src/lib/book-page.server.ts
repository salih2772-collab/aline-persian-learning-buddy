/** Looks up the text of a printed book page, applying the book's PDF page offset. */
export async function loadPageContent(
  supabase: { from: (t: string) => any },
  book: string,
  printedPage: string,
): Promise<string | null> {
  const { toEn } = await import("./aline");
  const printed = Number(toEn(printedPage));
  if (!Number.isFinite(printed)) return null;

  const { data: bookRow } = await supabase
    .from("books")
    .select("page_offset")
    .eq("name", book)
    .maybeSingle();
  const offset = bookRow?.page_offset ?? 0;

  const { data: bookPage } = await supabase
    .from("book_pages")
    .select("content")
    .eq("book", book)
    .eq("page", String(printed + offset))
    .maybeSingle();

  return bookPage?.content ?? null;
}
