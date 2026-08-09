/** Prompt + parsing helpers for the silent spelling analysis (server only). */

import { classifyIssue, dedupeIssues, type SpellingErrorType } from "./spelling";

export type SpellingIssue = {
  written_form: string;
  correct_form: string;
  error_type: SpellingErrorType;
};

export function buildSpellingPrompt(): string {
  return `تو یک تحلیل‌گر خاموشِ نوشتار فارسی برای کودکان دبستانی هستی.
متنی که کودک نوشته را بررسی کن و فقط کلمه‌های مشکل‌دار را فهرست کن.
هرگز پیام یا نصیحتی برای کودک ننویس؛ خروجی فقط داده است.

هر مورد باید دقیقاً یکی از این پنج نوع باشد:
- "شبیه‌نویسی": فقط وقتی حرفِ اشتباه از جفت‌های شبیه‌به‌هم باشد (ص/س، ث/س، ز/ذ/ض/ظ، ت/ط، ح/ه، ق/غ). مثال: «مدرصه» → «مدرسه».
- "املایی": افتادن، اضافه‌شدن یا اشتباه‌بودنِ حرفی که جزو جفت‌های بالا نیست. مثال: «خابم» → «خوابم» (حرف «و» افتاده است).
- "گفتاری": شکل محاوره‌ای و شفاهی که غلط نیست (خونه، نون، اره، میخام، آخه، دیگه). مثال: «خونه» → «خانه» همیشه گفتاری است، نه املایی.
- "نیم‌فاصله": نبودِ نیم‌فاصله در یک واژه (میخواهم → می‌خواهم).
- "فاصله‌گذاری": فاصله در جای اشتباه بین واژه‌ها. مثال: کودک نوشته «دوس تدارم» و درست آن «دوست دارم» است؛ در این حالت written_form باید کلِ عبارتِ «دوس تدارم» و correct_form «دوست دارم» باشد — نه «تدارم → دارم».

قواعد:
- هر واژه فقط یک بار و فقط در یک دسته گزارش شود؛ هرگز یک واژه را در دو دسته نیاور.
- اسم خاص، ایموجی و علائم را نادیده بگیر.
- اگر متن مشکلی ندارد، آرایه را خالی برگردان.
- correct_form باید دقیقاً همان املای درست و رسمیِ فرهنگ‌لغتیِ کلمه در فارسی معیار باشد. مثلاً «آزیت» و «ازیت» هر دو باید «اذیت» شوند، «خاهر» → «خواهر».
- اگر مطمئن نیستی correct_form واژهٔ واقعی و درست فارسی است، آن مورد را گزارش نکن.
- اگر correct_form با written_form یکسان شد، آن مورد را حذف کن.

فقط JSON با این شکل برگردان:
{"issues":[{"written_form":"...","correct_form":"...","error_type":"املایی"}]}`;
}

export function parseSpellingIssues(raw: string): SpellingIssue[] {
  try {
    const parsed = JSON.parse(raw) as {
      issues?: { written_form?: string; correct_form?: string; error_type?: string }[];
    };
    const cleaned = (parsed.issues ?? [])
      .filter(
        (i) =>
          typeof i.written_form === "string" &&
          i.written_form.trim().length > 0 &&
          typeof i.correct_form === "string" &&
          i.correct_form.trim().length > 0,
      )
      .map((i) => {
        const written = i.written_form!.trim().slice(0, 60);
        const correct = i.correct_form!.trim().slice(0, 60);
        // The category is decided by deterministic rules, not by the model.
        return { written_form: written, correct_form: correct, error_type: classifyIssue(written, correct) };
      })
      .filter((i) => i.correct_form !== i.written_form);

    // One batched call per session, so allow more issues than a per-message call.
    return dedupeIssues(cleaned).slice(0, 40);
  } catch {
    return [];
  }
}
