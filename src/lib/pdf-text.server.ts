/**
 * RTL-aware PDF text extraction.
 *
 * pdf.js returns text items in the order they appear in the content stream,
 * which for Persian/Arabic books scrambles the reading order. We instead read
 * the geometry of every item, group items into visual lines by their y
 * position, and sort each line right-to-left by x position.
 */

type TextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
};

const RTL_RE = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function isRtlPage(items: TextItem[]) {
  const sample = items.map((i) => i.str).join("").slice(0, 2000);
  return RTL_RE.test(sample);
}

function buildLines(items: TextItem[], rtl: boolean): string[] {
  const kept = items.filter((i) => i.str && i.str.trim().length > 0);
  if (kept.length === 0) return [];

  const avgHeight =
    kept.reduce((sum, i) => sum + (i.height || Math.abs(i.transform[3] ?? 10)), 0) / kept.length;
  const tolerance = Math.max(2, avgHeight * 0.5);

  type Line = { y: number; items: TextItem[] };
  const lines: Line[] = [];

  for (const item of kept) {
    const y = item.transform[5] ?? 0;
    const line = lines.find((l) => Math.abs(l.y - y) <= tolerance);
    if (line) {
      line.items.push(item);
      // keep a running representative y so drift doesn't split a line
      line.y = (line.y + y) / 2;
    } else {
      lines.push({ y, items: [item] });
    }
  }

  lines.sort((a, b) => b.y - a.y); // top of the page first

  return lines.map((line) => {
    const sorted = [...line.items].sort((a, b) => {
      const ax = a.transform[4] ?? 0;
      const bx = b.transform[4] ?? 0;
      return rtl ? bx - ax : ax - bx;
    });

    let text = "";
    let prevEdge: number | null = null;
    for (const item of sorted) {
      const x = item.transform[4] ?? 0;
      const width = item.width || 0;
      // For RTL the "next" item starts where the previous one ends on its left.
      const gap =
        prevEdge === null ? 0 : rtl ? prevEdge - (x + width) : x - prevEdge;
      if (text && gap > avgHeight * 0.25 && !text.endsWith(" ")) text += " ";
      text += item.str;
      prevEdge = rtl ? x : x + width;
    }
    return text.replace(/\s+/g, " ").trim();
  });
}

/** Extracts each PDF page as reading-ordered text (RTL aware). */
export async function extractPdfPages(buffer: Uint8Array): Promise<string[]> {
  const { getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(buffer);
  const pages: string[] = [];

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    const items = (content.items as unknown[]).filter(
      (i): i is TextItem => typeof (i as TextItem)?.str === "string",
    );
    const rtl = isRtlPage(items);
    pages.push(buildLines(items, rtl).join("\n").trim());
  }

  return pages;
}
