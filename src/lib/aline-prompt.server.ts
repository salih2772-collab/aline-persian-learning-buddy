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

export function buildSystemPrompt(
  session: SessionRow,
  phase: Phase,
  pageContent: string | null,
  wrapUp = false,
) {
  const name = session.student_name?.trim() || "دوست خوبم";
  const gentle = isGentleMood(session.mood_sticker);
  const isStory = session.content_type !== "lesson";
  const book = session.book ?? "";
  const isMath = book.includes("ریاضی");
  const isQuran = book.includes("قرآن");

  const weave =
    isStory && pageContent
      ? isMath
        ? "در دل داستان، به‌شکل طبیعی و نامحسوس شمارش و جمع‌وتفریق ساده با اشیای داستان (سیب، توپ، پرنده و…) بیاور که با مفهوم همان صفحهٔ کتاب ریاضی هماهنگ باشد. داستان نباید شبیه تمرین درسی شود؛ فقط یک یا دو جای کوچک عدد و شمارش داشته باشد. اگر محتوای صفحه با داستان جور در نمی‌آید، اصلاً آن را در داستان نیاور و به‌جایش بعد از داستان یک بخش جداگانه بگذار."
        : isQuran
          ? [
              "محتوای این صفحه قرآنی است (صداها، حرکت‌ها، شناخت کلمه‌ها). این نوع محتوا را هرگز داخل داستان نبر و آن را به داستان گره نزن.",
              "ساختار پاسخ دو بخش کاملاً جدا باشد: اول داستان اخلاقی کوتاه و کامل با پیام اخلاقی‌اش؛ بعد یک خط فاصله و سپس بخش جدا با تیتر «حالا بخش قرآن 📖» که فقط همان صفحه را ساده آموزش می‌دهد.",
              "هیچ‌وقت یک جملهٔ درسی و یک جملهٔ اخلاقی را با «ولی» یا «اما» یا هر رابط دیگری به هم وصل نکن، مگر واقعاً رابطهٔ منطقی داشته باشند.",
            ].join(" ")
          : "اگر نکته‌ای از متن صفحه به‌طور طبیعی در داستان جا می‌شود، نامحسوس بیاور؛ اگر جا نمی‌شود، آن را در داستان نیاور و بعد از داستان در بخشی جداگانه توضیح بده."
      : "";

  const phaseGuide: Record<Phase, string> = {
    greeting: `مرحلهٔ فعلی: «سلام و احوال‌پرسی». به ${name} سلام گرم بده، خودت را کوتاه معرفی کن و بپرس امروز چه حسی دارد (خوشحال، خوب، معمولی، ناراحت، عصبانی).`,
    day_check: `مرحلهٔ فعلی: «دربارهٔ روزش». به حسی که گفت واکنش مهربان نشان بده و یک سؤال کوتاه دربارهٔ امروزش بپرس (مدرسه، دوستان، بازی).`,
    content: !isStory
      ? `مرحلهٔ فعلی: «آموزش». فقط بر پایهٔ متن درسِ داده‌شده آموزش بده؛ چیزی از خودت به متن اضافه نکن. خلاصهٔ ساده و کودکانه بگو و در پایان یک سؤال از همان صفحه بپرس.`
      : [
          `مرحلهٔ فعلی: «داستان». یک داستان کوتاه اخلاقی${
            session.moral_topic ? ` دربارهٔ «${session.moral_topic}»` : ""
          } تعریف کن (حداکثر ۸ جمله)، پیام اخلاقی‌اش را بگو و در پایان یک سؤال بپرس.`,
          weave,
        ]
          .filter(Boolean)
          .join(" "),
  };

  // Only the content phase deals with lesson text, so its coherence rules are
  // pointless ballast in greeting/day_check.
  const coherenceRules =
    phase === "content" && !wrapUp
      ? [
          "انسجام: دو جملهٔ بی‌ربط را با «ولی/اما» وصل نکن؛ نکتهٔ درسی و پیام اخلاقی اگر ربط طبیعی ندارند در دو بخش جدا بیایند.",
          "اگر از متن صفحه سؤال مناسبِ سن کودک درنمی‌آید، صادقانه بگو و یک تمرین سادهٔ مرتبط پیشنهاد بده؛ چیزی از خودت نساز.",
        ].join(" ")
      : "";

  return [
    "تو «الین» هستی؛ همراه یادگیریِ مهربان و صبور کودکان دبستانی ایرانی. فارسی ساده، کوتاه و کودکانه بنویس، ایموجی کم و بجا، هرگز محتوای ترسناک یا نامناسب.",
    [
      "حرف‌های ناراحت‌کننده: کودک را هرگز مسئول احساس یا رفتار بزرگ‌ترها نکن.",
      "اگر گفت بزرگ‌تری او را زده/ترسانده/تحقیر کرده: احساسش را تأیید کن، بگو تقصیر او نیست، و پیشنهاد بده با یک بزرگ‌ترِ قابل‌اعتماد حرف بزند (معلم، پدربزرگ/مادربزرگ، مشاور مدرسه یا هر بزرگ‌ترِ مورد اعتماد) — نه فقط والدین.",
      "هرگز تشخیص روان‌شناختی نده، سؤال‌پیچ نکن و قول رازداری نده. کوتاه دلداری بده و نرم به ادامه برگرد.",
    ].join(" "),
    `نام کودک: ${name}.`,
    session.mood_sticker
      ? `حال امروز کودک: ${session.mood_sticker}${session.mood_reason ? ` — ${session.mood_reason}` : ""}.`
      : "",
    gentle ? "حال کودک خوب نیست: آرام‌تر و دلگرم‌کننده‌تر باش؛ اول احساسش را تأیید کن." : "",
    wrapUp
      ? [
          "مرحلهٔ فعلی: «پایان جلسه». هیچ سؤال جدیدی نپرس.",
          "در دو سه جملهٔ گرم جمع‌بندی کن که امروز چه کار کردیم، تشویق کن و خداحافظی کن.",
          'مقدار "question" را حتماً "" بگذار.',
        ].join(" ")
      : phaseGuide[phase],
    coherenceRules,
    // Page text is heavy; send it only in the teaching turn, never in
    // greeting/day_check or the wrap-up.
    pageContent && !wrapUp
      ? [
          `متن صفحهٔ کتاب (${session.book} — صفحهٔ ${session.page}):\n"""\n${pageContent.slice(0, 2500)}\n"""`,
          "اگر متن فهرست/جدول یا مجموعه‌ای از کلمه‌های جداست، هر مورد را جدا در نظر بگیر و دو مورد را به هم نچسبان تا عبارت تازه بسازی.",
        ].join("\n\n")
      : !pageContent && phase === "content" && !isStory && !wrapUp
        ? "متن این صفحه موجود نیست؛ مؤدبانه بگو و پیشنهاد بده با هم یک داستان بخوانید."
        : "",
    'خروجی فقط JSON معتبر: {"message": "...", "question": "..."}',
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** System prompt for building a short multiple-choice quiz from the session content. */
export function buildQuizPrompt(session: SessionRow, contentText: string, pageContent: string | null) {
  return [
    "تو «الین» هستی و می‌خواهی از محتوایی که همین الان با کودک دبستانی کار کردی، یک آزمون کوتاه بسازی.",
    "دقیقاً ۳ سؤال چهارگزینه‌ای بساز (هر سؤال ۳ گزینه). سؤال‌ها باید فقط دربارهٔ همین محتوا باشند، نه چیز دیگر.",
    "زبان فارسی ساده و کودکانه؛ سؤال‌ها کوتاه و گزینه‌ها کوتاه باشند. فقط یک گزینه درست باشد.",
    `محتوایی که گفته شد:\n"""\n${contentText.slice(0, 6000)}\n"""`,
    pageContent ? `متن صفحهٔ کتاب مرتبط:\n"""\n${pageContent.slice(0, 3000)}\n"""` : "",
    "اگر متن صفحه فهرست یا مجموعه‌ای از کلمه‌ها و عبارت‌های جداست، هر مورد را جدا در نظر بگیر و دو مورد جدا را به هم نچسبان تا عبارت تازه بسازی.",
    'خروجی فقط JSON معتبر: {"questions":[{"question":"...","options":["...","...","..."],"correct":0}]}',
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function nextPhase(current: Phase): Phase {
  if (current === "greeting") return "day_check";
  if (current === "day_check") return "content";
  return "content";
}

/**
 * Keeps the last few exchanges verbatim and compresses everything older into a
 * one-line recap, so input tokens stop growing with the conversation.
 */
export function compactHistory(
  past: { sender: string; text: string }[],
  keep = 6,
): { role: "user" | "assistant"; content: string }[] {
  const recent = past.slice(-keep);
  const older = past.slice(0, Math.max(0, past.length - keep));

  const messages: { role: "user" | "assistant"; content: string }[] = [];

  if (older.length > 0) {
    const summary = older
      .map((m) => {
        const who = m.sender === "child" ? "کودک" : "الین";
        const text = m.text.replace(/\s+/g, " ").trim().slice(0, 90);
        return `${who}: ${text}`;
      })
      .join(" | ");
    messages.push({
      role: "user",
      content: `خلاصهٔ بخش‌های قبلی گفت‌وگو (فقط برای یادآوری): ${summary.slice(0, 900)}`,
    });
  }

  for (const m of recent) {
    messages.push({
      role: m.sender === "child" ? "user" : "assistant",
      content: m.text,
    });
  }

  return messages;
}
