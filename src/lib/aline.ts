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
  childName: string;
  contentType: ContentType;
  book: string;
  chapter: string;
  page: string;
};

export const DEFAULT_SETTINGS: SessionSettings = {
  childName: "",
  contentType: "story",
  book: "فارسی سوم دبستان",
  chapter: "۲",
  page: "۱۴",
};

export const BOOKS = [
  "فارسی دوم دبستان",
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
    title: `درس ${s.chapter} — ${s.book}`,
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

export function generateContent(settings: SessionSettings, mood: Mood) {
  if (settings.contentType === "story") {
    const story = STORIES[mood === "sad" || mood === "angry" ? 0 : Math.floor(Math.random() * STORIES.length)];
    return [
      `📖 داستان امروز: «${story.title}»\n\n${story.body}`,
      `✨ پیام داستان: ${story.moral}`,
      `حالا چند سؤال کوچک:\n۱) ${story.questions[0]}\n۲) ${story.questions[1]}\n۳) ${story.questions[2]}`,
    ];
  }
  const lesson = makeLesson(settings);
  return [
    `📚 ${lesson.title}\n\n${lesson.summary}`,
    `نکته‌های مهم:\n• ${lesson.keyPoints.join("\n• ")}`,
    `سؤال‌های درسی:\n۱) ${lesson.questions[0]}\n۲) ${lesson.questions[1]}\n۳) ${lesson.questions[2]}`,
  ];
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
