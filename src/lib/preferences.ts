// App-level preferences (separate from per-session settings in aline.ts).

export type AppLanguage = "fa" | "en";
export type AppTheme = "light" | "dark";
export type FontSize = "small" | "medium" | "large";

export type AppPreferences = {
  language: AppLanguage;
  theme: AppTheme;
  fontSize: FontSize;
  sound: boolean;
};

export const DEFAULT_PREFERENCES: AppPreferences = {
  language: "fa",
  theme: "light",
  fontSize: "medium",
  sound: true,
};

export const FONT_SIZES: { id: FontSize; label: string; labelEn: string; px: string }[] = [
  { id: "small", label: "کوچک", labelEn: "Small", px: "15px" },
  { id: "medium", label: "متوسط", labelEn: "Medium", px: "17px" },
  { id: "large", label: "بزرگ", labelEn: "Large", px: "20px" },
];

const KEY = "aline.preferences";

export function loadPreferences(): AppPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: AppPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(prefs));
  applyPreferences(prefs);
}

/** Applies language direction, theme and font size to the document. */
export function applyPreferences(prefs: AppPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = prefs.language;
  root.dir = prefs.language === "fa" ? "rtl" : "ltr";
  root.classList.toggle("dark", prefs.theme === "dark");
  const size = FONT_SIZES.find((f) => f.id === prefs.fontSize) ?? FONT_SIZES[1]!;
  root.style.fontSize = size.px;
}

/** Simple UI copy so the preferences page itself can flip language. */
export const T = {
  fa: {
    title: "تنظیمات برنامه",
    subtitle: "زبان، ظاهر و صدا را برای همهٔ صفحه‌ها تنظیم کنید.",
    language: "زبان",
    theme: "پوسته",
    light: "روشن",
    dark: "تیره",
    fontSize: "اندازهٔ نوشته",
    sound: "صدا",
    soundOn: "روشن",
    soundOff: "خاموش",
    save: "ذخیرهٔ تنظیمات",
    saved: "تنظیمات ذخیره شد ✅",
    back: "بازگشت به داشبورد",
  },
  en: {
    title: "App preferences",
    subtitle: "Set language, appearance and sound for the whole app.",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    fontSize: "Font size",
    sound: "Sound",
    soundOn: "On",
    soundOff: "Off",
    save: "Save preferences",
    saved: "Preferences saved ✅",
    back: "Back to dashboard",
  },
} as const;
