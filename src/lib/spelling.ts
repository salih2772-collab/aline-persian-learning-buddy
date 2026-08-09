/** Client-safe types + analysis helpers for the writing-pattern dashboard. */

export type SpellingRow = {
  id: string;
  child_name: string;
  written_form: string;
  correct_form: string;
  error_type: string;
  created_at: string;
};

export const REAL_ERROR_TYPES = ["املایی", "شبیه‌نویسی"];

/** Letter groups that children commonly confuse when writing Persian. */
const CONFUSABLE_GROUPS = [
  ["ص", "س", "ث"],
  ["ز", "ذ", "ض", "ظ"],
  ["ت", "ط"],
  ["ح", "ه"],
  ["ق", "غ"],
];

function groupOf(ch: string) {
  return CONFUSABLE_GROUPS.find((g) => g.includes(ch));
}

/** Compares written vs correct form and returns the confused letter pairs, e.g. "س → ص". */
export function letterPairs(written: string, correct: string): string[] {
  const pairs: string[] = [];
  const len = Math.min(written.length, correct.length);
  if (written.length !== correct.length) return pairs;
  for (let i = 0; i < len; i++) {
    const w = written[i]!;
    const c = correct[i]!;
    if (w === c) continue;
    const g = groupOf(w);
    if (g && g.includes(c)) pairs.push(`${w} → ${c}`);
  }
  return pairs;
}

export function topConfusedPairs(rows: SpellingRow[], limit = 5) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.error_type !== "شبیه‌نویسی" && r.error_type !== "املایی") continue;
    for (const p of letterPairs(r.written_form, r.correct_form)) {
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pair, count]) => ({ pair, count }));
}
