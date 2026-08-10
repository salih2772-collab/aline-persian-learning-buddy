// Mock data + domain types for Aline (الین)

export type Mood = "happy" | "good" | "neutral" | "sad" | "angry";

export const MOODS: { id: Mood; emoji: string; label: string }[] = [
  { id: "happy", emoji: "😄", label: "خیلی خوبم" },
  { id: "good", emoji: "🙂", label: "خوبم" },
  { id: "neutral", emoji: "😐", label: "معمولی" },
  { id: "sad", emoji: "😢", label: "ناراحتم" },
  { id: "angry", emoji: "😡", label: "عصبانی‌ام" },
];

export type ContentType = "lesson" | "story";

export type SessionSettings = {
  /** Which of the parent's children this session is for. */
  childId: string | null;
  childName: string;
  contentType: ContentType;
  book: string;
  page: string;
  moralTopic: string;
  /** For stories: also weave content from the chosen book page into the story. */
  useBookInStory: boolean;
  /** Silent (never shown to the child) analysis of the child's writing. */
  spellingAnalysis: boolean;
};

export const DEFAULT_SETTINGS: SessionSettings = {
  childId: null,
  childName: "",
  contentType: "story",
  book: "فارسی سوم دبستان",
  page: "۱۴",
  moralTopic: "مهربانی",
  useBookInStory: false,
  spellingAnalysis: true,
};


export const MORAL_TOPICS = [
  "راستگویی",
  "کمک به دیگران",
  "شجاعت",
  "مهربانی",
  "احترام",
  "صبر",
];

export const BOOKS = [
  "فارسی دوم دبستان",
  "ریاضی دوم دبستان",
  "قرآن دوم دبستان",
  "فارسی سوم دبستان",
  "فارسی چهارم دبستان",
  "علوم سوم دبستان",
  "هدیه‌های آسمان چهارم",
];

const SETTINGS_KEY = "aline.settings";

export function loadSettings(): SessionSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SessionSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ---- Mock generated content -------------------------------------------------

export const MOOD_REPLIES: Record<Mood, string> = {
  happy: "چه عالی! انرژی‌ات کلاس ما را قشنگ‌تر می‌کند. 🌟",
  good: "خوشحالم که حالت خوب است. پس با هم شروع کنیم!",
  neutral: "اشکالی ندارد، بعضی روزها همین‌طوری‌اند. کم‌کم بهتر می‌شویم.",
  sad: "دلم برایت تنگ شد. بیا یک داستان مهربان بخوانیم تا حالت بهتر شود. 💛",
  angry: "می‌فهمم؛ گاهی همه عصبانی می‌شویم. سه نفس عمیق بکش، بعد شروع کنیم.",
};

export type StoryContent = {
  title: string;
  body: string;
  moral: string;
  questions: string[];
};

const STORIES: StoryContent[] = [
  {
    title: "گنجشک و دانه‌های مهربانی",
    body: "گنجشک کوچکی در حیاط مدرسه لانه داشت. یک روز سرد، دانه‌هایش تمام شد و گرسنه ماند. کبوتری که او را دید، نصف دانه‌های خودش را برایش آورد. گنجشک گفت: «اما این‌ها مال توست!» کبوتر خندید و گفت: «وقتی چیزی را قسمت می‌کنیم، کم نمی‌شود؛ بزرگ‌تر می‌شود.»",
    moral: "بخشیدن چیزی که داریم، دل ما را بزرگ‌تر می‌کند.",
    questions: [
      "چرا گنجشک گرسنه ماند؟",
      "کبوتر چه کار مهربانانه‌ای انجام داد؟",
      "تو تا حالا چیزی را با دوستت قسمت کرده‌ای؟ چه حسی داشت؟",
    ],
  },
  {
    title: "درخت راستگو",
    body: "علی توپش را در باغچه انداخت و یکی از گلدان‌ها شکست. اول خواست بگوید کار باد بوده، اما یاد حرف معلمش افتاد. رفت و به مادرش گفت: «من شکستم، ببخشید.» مادر لبخند زد و گفت: «شکستن گلدان ناراحتم کرد، اما راست گفتنت خوشحالم کرد.»",
    moral: "راست گفتن سخت است، ولی همیشه راه درست است.",
    questions: [
      "علی اول می‌خواست چه کار کند؟",
      "چرا مادر خوشحال شد؟",
      "اگر جای علی بودی چه می‌کردی؟",
    ],
  },
];

export type LessonContent = {
  title: string;
  summary: string;
  keyPoints: string[];
  questions: string[];
};

function makeLesson(s: SessionSettings): LessonContent {
  return {
    title: `${s.book} — صفحهٔ ${s.page}`,
    summary: `امروز صفحهٔ ${s.page} را با هم مرور می‌کنیم. این درس دربارهٔ دقت در خواندن و پیدا کردن پیام اصلی متن است. اول با هم می‌خوانیم، بعد چند سؤال کوتاه می‌پرسم.`,
    keyPoints: [
      "پیام اصلی متن را در یک جمله بگو.",
      "کلمه‌های تازه را پیدا کن و معنی‌شان را حدس بزن.",
      "متن را با صدای بلند و شمرده بخوان.",
    ],
    questions: [
      `در صفحهٔ ${s.page} شخصیت اصلی چه کسی است؟`,
      "کدام کلمه برایت تازه بود؟",
      "اگر بخواهی این درس را به دوستت تعریف کنی، چه می‌گویی؟",
    ],
  };
}

export type QuizQuestion = {
  question: string;
  options: string[];
  correct: number; // index in options
};

export type GeneratedContent = {
  messages: string[];
  quiz: QuizQuestion[];
  topic: string;
  type: "داستان" | "درس";
};

const STORY_QUIZZES: QuizQuestion[][] = [
  [
    {
      question: "چرا گنجشک گرسنه ماند؟",
      options: ["چون دانه‌هایش تمام شد", "چون لانه‌اش خراب شد", "چون خوابش می‌آمد"],
      correct: 0,
    },
    {
      question: "کبوتر چه کار کرد؟",
      options: ["پرواز کرد و رفت", "نصف دانه‌هایش را به گنجشک داد", "همهٔ دانه‌ها را خورد"],
      correct: 1,
    },
    {
      question: "پیام داستان چیست؟",
      options: ["تنها بودن بهتر است", "باید همیشه بدویم", "قسمت‌کردن دل ما را بزرگ‌تر می‌کند"],
      correct: 2,
    },
  ],
  [
    {
      question: "علی چه چیزی را شکست؟",
      options: ["شیشهٔ پنجره", "یک گلدان", "توپ همسایه"],
      correct: 1,
    },
    {
      question: "علی اول می‌خواست چه بگوید؟",
      options: ["بگوید کار باد بوده", "بگوید خودش شکسته", "چیزی نگوید"],
      correct: 0,
    },
    {
      question: "چرا مادر خوشحال شد؟",
      options: ["چون گلدان گران نبود", "چون علی راست گفت", "چون علی توپ داشت"],
      correct: 1,
    },
  ],
];

function makeLessonQuiz(s: SessionSettings): QuizQuestion[] {
  return [
    {
      question: `امروز کدام کتاب را مرور کردیم؟`,
      options: [s.book, "ریاضی پنجم دبستان", "ورزش و سلامت"],
      correct: 0,
    },
    {
      question: `درس امروز از کدام صفحه بود؟`,
      options: ["صفحهٔ ۹۹", `صفحهٔ ${s.page}`, "صفحهٔ آخر کتاب"],
      correct: 1,
    },
    {
      question: "برای فهمیدن بهتر متن، اول چه کار می‌کنیم؟",
      options: ["سریع ورق می‌زنیم", "فقط عکس‌ها را نگاه می‌کنیم", "با دقت و شمرده می‌خوانیم"],
      correct: 2,
    },
  ];
}

export function generateContent(settings: SessionSettings, mood: Mood): GeneratedContent {
  if (settings.contentType === "story") {
    const idx = mood === "sad" || mood === "angry" ? 0 : Math.floor(Math.random() * STORIES.length);
    const story = STORIES[idx] ?? STORIES[0]!;
    return {
      type: "داستان",
      topic: story.title,
      quiz: STORY_QUIZZES[idx] ?? STORY_QUIZZES[0]!,
      messages: [
        `📖 داستان امروز: «${story.title}»\n\n${story.body}`,
        `✨ پیام داستان: ${story.moral}`,
        `حالا چند سؤال کوچک:\n۱) ${story.questions[0]}\n۲) ${story.questions[1]}\n۳) ${story.questions[2]}`,
      ],
    };
  }
  const lesson = makeLesson(settings);
  return {
    type: "درس",
    topic: lesson.title,
    quiz: makeLessonQuiz(settings),
    messages: [
      `📚 ${lesson.title}\n\n${lesson.summary}`,
      `نکته‌های مهم:\n• ${lesson.keyPoints.join("\n• ")}`,
      `سؤال‌های درسی:\n۱) ${lesson.questions[0]}\n۲) ${lesson.questions[1]}\n۳) ${lesson.questions[2]}`,
    ],
  };
}

// ---- Quiz results storage ---------------------------------------------------

export type QuizResult = {
  id: number;
  at: number; // timestamp
  topic: string;
  type: "داستان" | "درس";
  correct: number;
  total: number;
  score: number; // percent
  mood: Mood;
};

const QUIZ_KEY = "aline.quiz";

export function loadQuizResults(): QuizResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUIZ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QuizResult[]) : [];
  } catch {
    return [];
  }
}

export function saveQuizResult(result: Omit<QuizResult, "id" | "at">) {
  if (typeof window === "undefined") return;
  const all = loadQuizResults();
  all.push({ ...result, id: Date.now(), at: Date.now() });
  window.localStorage.setItem(QUIZ_KEY, JSON.stringify(all.slice(-50)));
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
export function toFa(n: number | string) {
  return String(n).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]!);
}

/** Converts Persian/Arabic digits to plain English digits. */
export function toEn(value: string) {
  return String(value)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function formatFaDate(ts: number) {
  try {
    return new Intl.DateTimeFormat("fa-IR", { month: "long", day: "numeric" }).format(new Date(ts));
  } catch {
    return "";
  }
}

export const FALLBACK_REPLIES = [
  "آفرین! خیلی خوب فکر کردی. کمی بیشتر توضیح می‌دهی؟",
  "چه جواب قشنگی! به نظرت چرا این‌طور است؟",
  "خیلی خوب بود. یک نکتهٔ دیگر هم اضافه کن.",
  "دقیقاً! حالا بگو اگر تو جای شخصیت داستان بودی چه می‌کردی؟",
];

// ---- Mock dashboard data ----------------------------------------------------

export const WEEKLY_ACTIVITY = [
  { day: "شنبه", minutes: 12, sessions: 1 },
  { day: "یکشنبه", minutes: 18, sessions: 2 },
  { day: "دوشنبه", minutes: 9, sessions: 1 },
  { day: "سه‌شنبه", minutes: 24, sessions: 2 },
  { day: "چهارشنبه", minutes: 16, sessions: 2 },
  { day: "پنجشنبه", minutes: 28, sessions: 3 },
  { day: "جمعه", minutes: 21, sessions: 2 },
];

export const MOOD_DISTRIBUTION = [
  { name: "خیلی خوب", value: 8, key: "happy" },
  { name: "خوب", value: 6, key: "good" },
  { name: "معمولی", value: 3, key: "neutral" },
  { name: "ناراحت", value: 2, key: "sad" },
  { name: "عصبانی", value: 1, key: "angry" },
];

export const RECENT_SESSIONS = [
  { id: 1, date: "۱۴ مرداد", type: "داستان", topic: "گنجشک و دانه‌های مهربانی", mood: "😄", score: 92 },
  { id: 2, date: "۱۳ مرداد", type: "درس", topic: "فارسی سوم — درس ۲", mood: "🙂", score: 84 },
  { id: 3, date: "۱۲ مرداد", type: "داستان", topic: "درخت راستگو", mood: "😐", score: 76 },
  { id: 4, date: "۱۱ مرداد", type: "درس", topic: "علوم سوم — درس ۱", mood: "🙂", score: 88 },
];
