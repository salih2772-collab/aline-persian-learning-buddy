import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlineHeader } from "@/components/aline-header";
import { BookUploader } from "@/components/book-uploader";
import { BOOKS, DEFAULT_SETTINGS, loadSettings, saveSettings, type SessionSettings } from "@/lib/aline";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "تنظیم جلسه | الین" },
      {
        name: "description",
        content: "نام کودک، نوع محتوا (درس یا داستان)، کتاب، فصل و صفحه را برای جلسهٔ بعدی الین تنظیم کنید.",
      },
      { property: "og:title", content: "تنظیم جلسه | الین" },
      { property: "og:description", content: "والدین و معلمان جلسهٔ یادگیری کودک را اینجا تنظیم می‌کنند." },
    ],
  }),
  component: SettingsPage,
});

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring";

function SettingsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SessionSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(loadSettings());
  }, []);

  function update<K extends keyof SessionSettings>(key: K, value: SessionSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  return (
    <div className="min-h-screen pb-16">
      <AlineHeader subtitle="بخش والدین و معلمان" />
      <main className="mx-auto w-full max-w-3xl px-4 pt-8">
        <h1 className="text-3xl font-black">تنظیم جلسهٔ یادگیری</h1>
        <p className="text-balance-fa mt-2 text-sm text-muted-foreground">
          مشخص کنید الین در جلسهٔ بعدی چه چیزی برای کودک آماده کند.
        </p>

        <form
          className="card-soft mt-6 grid gap-5 p-5 sm:p-7"
          onSubmit={(e) => {
            e.preventDefault();
            saveSettings(form);
            setSaved(true);
          }}
        >
          <label className="grid gap-2">
            <span className="text-sm font-bold">نام کودک</span>
            <input
              className={fieldClass}
              value={form.childName}
              onChange={(e) => update("childName", e.target.value)}
              placeholder="مثلاً سارا"
              required
            />
          </label>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-bold">نوع محتوا</legend>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "story", label: "داستان اخلاقی", emoji: "📖" },
                  { id: "lesson", label: "محتوای درسی", emoji: "📚" },
                ] as const
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => update("contentType", opt.id)}
                  className={`rounded-2xl border p-4 text-center transition-colors ${
                    form.contentType === opt.id
                      ? "border-primary bg-primary/10 font-bold text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="block text-2xl">{opt.emoji}</span>
                  <span className="mt-1 block text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="grid gap-2">
            <span className="text-sm font-bold">کتاب</span>
            <select className={fieldClass} value={form.book} onChange={(e) => update("book", e.target.value)}>
              {BOOKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-bold">فصل / درس</span>
              <input
                className={fieldClass}
                value={form.chapter}
                onChange={(e) => update("chapter", e.target.value)}
                placeholder="۲"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-bold">صفحه</span>
              <input
                className={fieldClass}
                value={form.page}
                onChange={(e) => update("page", e.target.value)}
                placeholder="۱۴"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              ذخیرهٔ تنظیمات
            </button>
            <button
              type="button"
              onClick={() => {
                saveSettings(form);
                navigate({ to: "/chat" });
              }}
              className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
            >
              ذخیره و شروع جلسه
            </button>
            {saved ? <span className="text-sm font-bold text-success">ذخیره شد ✓</span> : null}
          </div>
        </form>

        <BookUploader book={form.book} />
      </main>

    </div>
  );
}
