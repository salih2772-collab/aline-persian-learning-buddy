/** Prompt + parsing helpers for the silent spelling analysis (server only). */

export const ERROR_TYPES = ["املایی", "شبیه‌نویسی", "گفتاری", "نیم‌فاصله"] as const;
export type SpellingErrorType = (typeof ERROR_TYPES)[number];

export type SpellingIssue = {
  written_form: string;
  correct_form: string;
  error_type: SpellingErrorType;
};

export function buildSpellingPrompt(): string {
  return `تو یک تحلیل‌گر خاموشِ نوشتار فارسی برای کودکان دبستانی هستی.
متنی که کودک نوشته را بررسی کن و فقط کلمه‌های مشکل‌دار را فهرست کن.
هرگز پیام یا نصیحتی برای کودک ننویس؛ خروجی فقط داده است.

هر مورد باید یکی از این چهار نوع باشد:
- "املایی": غلط املایی واقعی (مثل «سلانم» به‌جای «سلام»)
- "شبیه‌نویسی": اشتباه در حروف هم‌صدا (ص/س، ث/س، ز/ذ/ض/ظ، ت/ط، ح/ه، ق/غ)
- "گفتاری": نوشتار محاوره‌ای که غلط نیست (میخام، چیکار، اره)
- "نیم‌فاصله": نبودِ نیم‌فاصله (میخواهم به‌جای می‌خواهم)

قواعد:
- اسم خاص، ایموجی و علائم را نادیده بگیر.
- اگر متن مشکلی ندارد، آرایه را خالی برگردان.
- correct_form باید شکل درستِ نوشتاری همان کلمه باشد.

فقط JSON با این شکل برگردان:
{"issues":[{"written_form":"...","correct_form":"...","error_type":"املایی"}]}`;
}

export function parseSpellingIssues(raw: string): SpellingIssue[] {
  try {
    const parsed = JSON.parse(raw) as {
      issues?: { written_form?: string; correct_form?: string; error_type?: string }[];
    };
    return (parsed.issues ?? [])
      .filter(
        (i): i is SpellingIssue =>
          typeof i.written_form === "string" &&
          i.written_form.trim().length > 0 &&
          typeof i.correct_form === "string" &&
          ERROR_TYPES.includes(i.error_type as SpellingErrorType),
      )
      .map((i) => ({
        written_form: i.written_form.trim().slice(0, 60),
        correct_form: i.correct_form.trim().slice(0, 60),
        error_type: i.error_type,
      }))
      .slice(0, 10);
  } catch {
    return [];
  }
}
