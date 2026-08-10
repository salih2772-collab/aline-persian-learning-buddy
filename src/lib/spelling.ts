/** Client-safe types + analysis helpers for the writing-pattern dashboard. */

export type SpellingRow = {
  id: string;
  child_name: string;
  written_form: string;
  correct_form: string;
  error_type: string;
  created_at: string;
};

export const ERROR_TYPES = [
  "املایی",
  "شبیه‌نویسی",
  "گفتاری",
  "نیم‌فاصله",
  "فاصله‌گذاری",
] as const;
export type SpellingErrorType = (typeof ERROR_TYPES)[number];

/** Types that really need practice (colloquial + spacing are not "errors"). */
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

const ZWNJ = "\u200c";

function stripSpaces(s: string) {
  return s.replace(/[\s\u200c]/g, "");
}

/** Common colloquial (spoken) forms — natural at this age, never counted as errors. */
const COLLOQUIAL = new Set([
  "خونه",
  "نون",
  "اره",
  "آره",
  "نه‌بابا",
  "میخام",
  "می‌خام",
  "میخوام",
  "می‌خوام",
  "آخه",
  "اخه",
  "چیکار",
  "دیگه",
  "همینه",
  "بریم",
  "میگم",
  "می‌گم",
  "میگه",
  "بچه‌ها",
  "کجاست",
  "اینجوری",
  "اونجا",
  "اونا",
  "اون",
  "بیرونه",
]);

/** Spoken stem contractions kids write (left = spoken, right = formal). */
const SPOKEN_STEMS: [RegExp, string][] = [
  [/بزار/g, "بگذار"],
  [/بذار/g, "بگذار"],
  [/زاشت/g, "گذاشت"],
  [/ذاشت/g, "گذاشت"],
  [/تونست/g, "توانست"],
  [/تون/g, "توان"],
  [/خواس/g, "خواست"],
  [/رو$/g, "را"],
];

/** Verb endings: spoken → formal (کنه→کند، گم→گویم، رن→روند). */
const SPOKEN_ENDINGS: [string, string[]][] = [
  ["ه", ["د", "هد"]],
  ["ن", ["ند"]],
  ["م", ["یم", "ویم", "هم"]],
  ["ی", ["ید", "یی"]],
  ["یم", ["هیم", "ویم"]],
  ["ید", ["هید"]],
];

function isSubsequence(short: string, long: string) {
  let i = 0;
  for (const ch of long) if (ch === short[i]) i++;
  return i === short.length;
}

/**
 * True when `written` is a common spoken contraction of the verb / pronoun form
 * in `correct` (می‌کنه ← می‌کند، می‌گم ← می‌گویم، همش ← همه‌اش).
 */
function isSpokenContraction(written: string, correct: string) {
  const w0 = stripSpaces(written);
  const c = stripSpaces(correct);
  if (!w0 || !c || w0 === c || w0.length >= c.length + 1) return false;

  // Only verbs (می/ن/ب prefix) or pronoun-clitic words qualify.
  const verbish = /^(نمی|می|ب|ن)/.test(w0) && w0.length > 2;
  const clitic = /[شمت]$/.test(w0) && new RegExp(`ا?[${w0.slice(-1)}]$`).test(c);
  if (!verbish && !clitic) return false;

  const candidates = new Set<string>([w0]);
  let stemmed = w0;
  for (const [re, rep] of SPOKEN_STEMS) stemmed = stemmed.replace(re, rep);
  candidates.add(stemmed);

  for (const base of [...candidates]) {
    for (const [spoken, formals] of SPOKEN_ENDINGS) {
      if (!base.endsWith(spoken)) continue;
      for (const f of formals) candidates.add(base.slice(0, -spoken.length) + f);
    }
  }

  for (const cand of candidates) {
    if (cand === c) return true;
    if (cand.length < c.length && isSubsequence(cand, c)) return true;
  }
  return false;
}

/** Heuristic: spoken "ون/وم/وی" where formal Persian has "ان/ام/ای" (خونه→خانه، نون→نان). */
function looksColloquial(written: string, correct: string) {
  if (COLLOQUIAL.has(written) || COLLOQUIAL.has(stripSpaces(written))) return true;
  if (isSpokenContraction(written, correct)) return true;
  if (written.length !== correct.length) return false;
  let diffs = 0;
  let spokenVowel = 0;
  for (let i = 0; i < written.length; i++) {
    const w = written[i]!;
    const c = correct[i]!;
    if (w === c) continue;
    diffs++;
    if (w === "و" && c === "ا") spokenVowel++;
    if (w === "ی" && c === "ا") spokenVowel++;
  }
  return diffs > 0 && diffs === spokenVowel;
}


/**
 * Decides the single correct category for one issue.
 * Deterministic so the AI can never split one word across two categories.
 */
export function classifyIssue(written: string, correct: string): SpellingErrorType {
  const w = written.trim();
  const c = correct.trim();

  // Same letters, different spacing → a word-boundary / half-space mistake.
  if (w !== c && stripSpaces(w) === stripSpaces(c)) {
    const onlyZwnj = w.replace(/\u200c/g, " ").replace(/\s+/g, " ") === c.replace(/\u200c/g, " ").replace(/\s+/g, " ");
    return onlyZwnj || c.includes(ZWNJ) ? "نیم‌فاصله" : "فاصله‌گذاری";
  }

  // Spoken forms are developmental, not errors.
  if (looksColloquial(w, c)) return "گفتاری";

  // Same length and every difference is a confusable pair → شبیه‌نویسی.
  if (w.length === c.length) {
    let diffs = 0;
    let confusable = 0;
    for (let i = 0; i < w.length; i++) {
      const a = w[i]!;
      const b = c[i]!;
      if (a === b) continue;
      diffs++;
      const g = groupOf(a);
      if (g && g.includes(b)) confusable++;
    }
    if (diffs > 0 && diffs === confusable) return "شبیه‌نویسی";
  }

  // Missing / extra / wrong letters that are not a confusable pair.
  return "املایی";
}

/** Keeps one entry per written word so nothing is counted twice. */
export function dedupeIssues<T extends { written_form: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    const key = stripSpaces(r.written_form);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
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
    if (r.error_type !== "شبیه‌نویسی") continue;
    for (const p of letterPairs(r.written_form, r.correct_form)) {
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pair, count]) => ({ pair, count }));
}
