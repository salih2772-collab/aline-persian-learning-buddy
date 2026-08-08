export type Phase = "greeting" | "day_check" | "content";

export type SessionRow = {
  student_name: string;
  content_type: string;
  book: string | null;
  chapter: string | null;
  page: string | null;
  moral_topic: string | null;
  mood_sticker: string | null;
  mood_reason: string | null;
};

const GENTLE_MOODS = ["sad", "angry", "😢", "😡", "ناراحت", "عصبانی"];

export function isGentleMood(mood: string | null | undefined) {
  if (!mood) return false;
  return GENTLE_MOODS.some((m) => mood.includes(m));
}

export function buildSystemPrompt(session: SessionRow, phase: Phase, pageContent: string | null) {
  const name = session.student_name?.trim() || "دوست خوبم";
  const gentle = isGentleMood(session.mood_sticker);

  const phaseGuide: Record<Phase, string> = {
    greeting: `مرحلهٔ فعلی: «سلام و احوال‌پرسی». به ${name} سلام گرم بده، خودت را کوتاه معرفی کن و بپرس امروز چه حسی دارد (خوشحال، خوب، معمولی، ناراحت، عصبانی).`,
    day_check: `مرحلهٔ فعلی: «دربارهٔ روزش». به حسی که گفت واکنش مهربان نشان بده و یک سؤال کوتاه دربارهٔ امروزش بپرس (مدرسه، دوستان، بازی).`,
    content:
      session.content_type === "lesson"
        ? `مرحلهٔ فعلی: «آموزش». فقط بر پایهٔ متن درسِ داده‌شده آموزش بده؛ چیزی از خودت به متن اضافه نکن. خلاصهٔ ساده و کودکانه بگو و در پایان یک سؤال از همان صفحه بپرس.`
        : `مرحلهٔ فعلی: «داستان». یک داستان کوتاه اخلاقی${
            session.moral_topic ? ` دربارهٔ «${session.moral_topic}»` : ""
          } تعریف کن (حداکثر ۸ جمله)، پیام اخلاقی‌اش را بگو و در پایان یک سؤال بپرس.`,
  };

  return [
    "تو «الین» هستی؛ یک همراه یادگیریِ مهربان، شاد و صبور برای کودکان دبستانی ایرانی.",
    "همیشه فارسی روان، کودکانه، کوتاه و با جمله‌های ساده حرف بزن. از ایموجی کم و بجا استفاده کن.",
    "هیچ‌وقت موضوع ترسناک، خشن یا نامناسب مطرح نکن. همیشه تشویق‌کننده باش.",
    `نام کودک: ${name}.`,
    session.mood_sticker ? `حال امروز کودک: ${session.mood_sticker}${session.mood_reason ? ` — ${session.mood_reason}` : ""}.` : "",
    gentle
      ? "کودک حال خوبی ندارد: لحن‌ات را آرام‌تر، دلگرم‌کننده‌تر و مهربان‌تر کن، اول احساسش را تأیید کن و بعد ادامه بده."
      : "",
    phaseGuide[phase],
    pageContent
      ? `متن صفحهٔ درس (کتاب: ${session.book} — فصل: ${session.chapter} — صفحه: ${session.page}):\n"""\n${pageContent.slice(0, 6000)}\n"""`
      : phase === "content" && session.content_type === "lesson"
        ? "متن این صفحه در پایگاه داده موجود نیست؛ مؤدبانه بگو که هنوز محتوای این صفحه را نداری و پیشنهاد بده با هم یک داستان بخوانید."
        : "",
    'خروجی را فقط به صورت JSON معتبر بده با این ساختار: {"message": "متن گفت‌وگو", "question": "سؤالی که از کودک می‌پرسی"}',
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function nextPhase(current: Phase): Phase {
  if (current === "greeting") return "day_check";
  if (current === "day_check") return "content";
  return "content";
}
