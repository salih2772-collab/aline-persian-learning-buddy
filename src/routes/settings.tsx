import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlineHeader } from "@/components/aline-header";
import {
  DEFAULT_PREFERENCES,
  FONT_SIZES,
  T,
  applyPreferences,
  loadPreferences,
  savePreferences,
  type AppPreferences,
} from "@/lib/preferences";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "تنظیمات برنامه | الین" },
      {
        name: "description",
        content: "زبان فارسی یا انگلیسی، پوستهٔ روشن و تیره، اندازهٔ نوشته و صدای برنامهٔ الین را تنظیم کنید.",
      },
      { property: "og:title", content: "تنظیمات برنامه | الین" },
      {
        property: "og:description",
        content: "زبان، جهت صفحه، پوسته، اندازهٔ نوشته و صدا — تنظیمات کلی الین.",
      },
    ],
  }),
  component: PreferencesPage,
});

function PreferencesPage() {
  const [prefs, setPrefs] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
  }, []);

  const t = T[prefs.language];

  // Live preview: applying immediately shows the direction/theme flip.
  function update(patch: Partial<AppPreferences>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaved(false);
    applyPreferences(next);
  }

  function save() {
    savePreferences(prefs);
    setSaved(true);
  }

  return (
    <div className="min-h-screen pb-16">
      <AlineHeader subtitle={t.title} />
      <main className="mx-auto w-full max-w-2xl px-4 pt-8">
        <h1 className="text-3xl font-black">{t.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>

        <div className="card-soft mt-6 space-y-6 p-5">
          <Field label={t.language}>
            <Options
              value={prefs.language}
              options={[
                { id: "fa", label: "فارسی 🇮🇷" },
                { id: "en", label: "English 🇬🇧" },
              ]}
              onChange={(language) => update({ language })}
            />
          </Field>

          <Field label={t.theme}>
            <Options
              value={prefs.theme}
              options={[
                { id: "light", label: `☀️ ${t.light}` },
                { id: "dark", label: `🌙 ${t.dark}` },
              ]}
              onChange={(theme) => update({ theme })}
            />
          </Field>

          <Field label={t.fontSize}>
            <Options
              value={prefs.fontSize}
              options={FONT_SIZES.map((f) => ({
                id: f.id,
                label: prefs.language === "fa" ? f.label : f.labelEn,
              }))}
              onChange={(fontSize) => update({ fontSize })}
            />
          </Field>

          <Field label={t.sound}>
            <Options
              value={prefs.sound ? "on" : "off"}
              options={[
                { id: "on", label: `🔊 ${t.soundOn}` },
                { id: "off", label: `🔇 ${t.soundOff}` },
              ]}
              onChange={(v) => update({ sound: v === "on" })}
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            className="rounded-full bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t.save}
          </button>
          <Link
            to="/dashboard"
            className="rounded-full border border-border px-5 py-3 text-sm font-bold transition-colors hover:bg-secondary"
          >
            {t.back}
          </Link>
          {saved ? <span className="text-sm font-bold text-primary">{t.saved}</span> : null}
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold">{label}</p>
      {children}
    </div>
  );
}

function Options<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
            value === o.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-secondary"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
