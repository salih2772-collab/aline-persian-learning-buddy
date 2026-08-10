import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlineHeader } from "@/components/aline-header";
import {
  CharacterAvatar,
  characterName,
  colourName,
  type CharacterId,
} from "@/components/character-avatar";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardData } from "@/lib/data.functions";
import { listChildren, type Child } from "@/lib/children.functions";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import {
  MOODS,
  MOOD_DISTRIBUTION,
  RECENT_SESSIONS,
  WEEKLY_ACTIVITY,
  formatFaDate,
  loadQuizResults,
  toFa,
  type QuizResult,
} from "@/lib/aline";
import {
  REAL_ERROR_TYPES,
  classifyIssue,
  dedupeIssues,
  topConfusedPairs,
  type SpellingRow,
} from "@/lib/spelling";



export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "داشبورد پیشرفت | الین" },
      {
        name: "description",
        content: "نمودار فعالیت هفتگی، حال‌وهوای کودک و فهرست جلسه‌های اخیر برای والدین و معلمان.",
      },
      { property: "og:title", content: "داشبورد پیشرفت | الین" },
      { property: "og:description", content: "آمار و نمودارهای یادگیری کودک در یک نگاه." },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

type MoodRow = {
  id: string;
  student_name: string;
  mood_sticker: string | null;
  created_at: string;
};

type DoneRow = {
  id: string;
  content_type: string;
  moral_topic: string | null;
  book: string | null;
  page: string | null;
  mood_sticker: string | null;
  quiz_correct: number | null;
  quiz_total: number | null;
  completed_at: string | null;
  created_at: string;
};

type CharacterRow = {
  id: string;
  student_name: string;
  character_choice: string | null;
  colour_choice: string | null;
  created_at: string;
};

function DashboardPage() {
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);
  const [moodRows, setMoodRows] = useState<MoodRow[]>([]);
  const [spelling, setSpelling] = useState<SpellingRow[]>([]);
  const [doneRows, setDoneRows] = useState<DoneRow[]>([]);
  const [characterRows, setCharacterRows] = useState<CharacterRow[]>([]);

  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadData = useServerFn(getDashboardData);
  const loadChildren = useServerFn(listChildren);

  useEffect(() => {
    void loadChildren().then(setChildren).catch(() => {});
  }, [loadChildren]);

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  useEffect(() => {
    setQuizzes(loadQuizResults());
    void loadData({ data: { childId } }).then((res) => {
      setMoodRows((res.moods as MoodRow[]) ?? []);
      setDoneRows((res.done as DoneRow[]) ?? []);
      setSpelling((res.spelling as SpellingRow[]) ?? []);
      setCharacterRows((res.characters as CharacterRow[]) ?? []);
    });
  }, [loadData, childId]);


  // Re-classify with the current rules and keep each word in exactly one category.
  const normalized = dedupeIssues(
    spelling.map((r) => ({ ...r, error_type: classifyIssue(r.written_form, r.correct_form) })),
  );
  const realIssues = normalized.filter((r) => REAL_ERROR_TYPES.includes(r.error_type));
  const colloquial = normalized.filter((r) => r.error_type === "گفتاری");
  const spacing = normalized.filter(
    (r) => r.error_type === "نیم‌فاصله" || r.error_type === "فاصله‌گذاری",
  );
  const pairs = topConfusedPairs(normalized);



  const totalMinutes = WEEKLY_ACTIVITY.reduce((a, d) => a + d.minutes, 0);
  const totalSessions = WEEKLY_ACTIVITY.reduce((a, d) => a + d.sessions, 0);

  const scoreSource = quizzes.length > 0 ? quizzes.map((q) => q.score) : RECENT_SESSIONS.map((s) => s.score);
  const avgScore = Math.round(scoreSource.reduce((a, s) => a + s, 0) / scoreSource.length);

  const trend = quizzes.slice(-8).map((q, i) => ({
    label: `${toFa(i + 1)}`,
    score: q.score,
  }));

  const finishedSessions = doneRows.map((r) => ({
    id: `s-${r.id}`,
    date: formatFaDate(new Date(r.completed_at ?? r.created_at).getTime()),
    type: r.content_type === "lesson" ? "درس" : "داستان",
    topic:
      r.content_type === "lesson"
        ? `${r.book ?? "درس"}${r.page ? ` — صفحهٔ ${toFa(r.page)}` : ""}`
        : (r.moral_topic ?? "داستان اخلاقی"),
    mood: r.mood_sticker
      ? (MOODS.find((m) => m.id === r.mood_sticker)?.emoji ?? r.mood_sticker)
      : "🙂",
    score:
      r.quiz_total && r.quiz_total > 0
        ? Math.round(((r.quiz_correct ?? 0) / r.quiz_total) * 100)
        : null,
    done: true,
  }));

  const realSessions = [...quizzes].reverse().map((q) => ({
    id: `q-${q.id}`,
    date: formatFaDate(q.at),
    type: q.type,
    topic: q.topic,
    mood: MOODS.find((m) => m.id === q.mood)?.emoji ?? "🙂",
    score: q.score as number | null,
    done: false,
  }));
  const mockSessions = RECENT_SESSIONS.map((s) => ({
    ...s,
    id: `m-${s.id}`,
    score: s.score as number | null,
    done: false,
  }));
  const sessions = [...finishedSessions, ...realSessions, ...mockSessions].slice(0, 8);

  return (
    <div className="min-h-screen pb-16">
      <AlineHeader subtitle="داشبورد والدین و معلمان" />
      <main className="mx-auto w-full max-w-3xl px-4 pt-8">
        <h1 className="text-3xl font-black">پیشرفت این هفته</h1>
        <p className="mt-2 text-sm text-muted-foreground">خلاصه‌ای از جلسه‌های کودک با الین.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/session"
            className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
          >
            تنظیم جلسهٔ جدید ⚙️
          </Link>
          <Link
            to="/settings"
            className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-secondary"
          >
            تنظیمات برنامه 🎛️
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-secondary"
          >
            خروج از حساب 🚪
          </button>
        </div>

        {children.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">کودک:</span>
            <button
              type="button"
              onClick={() => setChildId(null)}
              className={`rounded-full border px-4 py-2 text-sm ${childId === null ? "border-primary bg-primary/10 font-bold text-primary" : "border-border bg-card text-muted-foreground"}`}
            >
              همه
            </button>
            {children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChildId(c.id)}
                className={`rounded-full border px-4 py-2 text-sm ${childId === c.id ? "border-primary bg-primary/10 font-bold text-primary" : "border-border bg-card text-muted-foreground"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="دقیقهٔ یادگیری" value={toFa(totalMinutes)} emoji="⏱️" />
          <Stat label="تعداد جلسه" value={toFa(totalSessions)} emoji="💬" />
          <Stat label="میانگین نمرهٔ آزمون" value={`${toFa(avgScore)}٪`} emoji="⭐" />
          <Stat label="تعداد آزمون" value={toFa(quizzes.length)} emoji="📝" />
        </section>


        <section className="card-soft mt-5 p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-black">فعالیت هفتگی (دقیقه)</h2>
          <div className="h-60 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_ACTIVITY}>
                <XAxis
                  dataKey="day"
                  reversed
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-secondary)" }}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontFamily: "Vazirmatn, sans-serif",
                    direction: "rtl",
                  }}
                />
                <Bar dataKey="minutes" name="دقیقه" fill="var(--color-chart-1)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card-soft mt-5 p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-black">حال‌وهوای کودک</h2>
          <div className="grid items-center gap-4 sm:grid-cols-[1fr_1fr]">
            <div className="h-52 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={MOOD_DISTRIBUTION} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {MOOD_DISTRIBUTION.map((entry, i) => (
                      <Cell key={entry.key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontFamily: "Vazirmatn, sans-serif",
                      direction: "rtl",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid gap-2 text-sm">
              {MOOD_DISTRIBUTION.map((m, i) => (
                <li key={m.key} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span className="shrink-0 font-bold text-muted-foreground">{m.value} بار</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {quizzes.length > 0 ? (
          <section className="card-soft mt-5 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-black">روند نمرهٔ آزمون‌ها</h2>
            <div className="h-56 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    reversed
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                      fontFamily: "Vazirmatn, sans-serif",
                      direction: "rtl",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="نمره"
                    stroke="var(--color-chart-2)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        ) : null}

        <section className="card-soft mt-5 p-4 sm:p-6">
          <h2 className="text-lg font-black">روند حال‌وهوا</h2>
          <p className="text-balance-fa mt-1 text-xs text-muted-foreground">
            برای حفظ اعتماد کودک، آنچه دربارهٔ احساسش می‌نویسد نمایش داده نمی‌شود؛ فقط روند کلی حال او را
            می‌بینید.
          </p>
          {moodRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">هنوز حالی ثبت نشده است.</p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-5 gap-2">
                {MOODS.map((m) => {
                  const count = moodRows.filter((r) => r.mood_sticker === m.id).length;
                  return (
                    <div
                      key={m.id}
                      className="flex flex-col items-center gap-1 rounded-2xl bg-secondary/60 p-2 text-center"
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-sm font-black">{toFa(count)}</span>
                      <span className="text-[10px] leading-tight text-muted-foreground">{m.label}</span>
                    </div>
                  );
                })}
              </div>
              <ul className="mt-4 grid gap-2">
                {moodRows.map((r) => {
                  const m = MOODS.find((x) => x.id === r.mood_sticker);
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/40 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{m?.emoji ?? "🙂"}</span>
                        <span className="font-bold">{m?.label ?? r.mood_sticker}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatFaDate(new Date(r.created_at).getTime())}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section className="card-soft mt-5 p-4 sm:p-6">
          <h2 className="text-lg font-black">شخصیت و رنگ انتخابی</h2>
          <p className="text-balance-fa mt-1 text-xs text-muted-foreground">
            فقط یک یادداشت بازیگوشانه از انتخاب کودک است؛ رنگ هیچ معنای احساسی یا روان‌شناختی ندارد.
          </p>
          {characterRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">هنوز شخصیتی انتخاب نشده است.</p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {characterRows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/40 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <CharacterAvatar
                      character={(r.character_choice as CharacterId) ?? "mahtab"}
                      colour={r.colour_choice}
                      className="h-8 w-8"
                    />
                    <span className="font-bold">
                      شخصیت {characterName(r.character_choice) ?? "—"}، رنگ{" "}
                      {colourName(r.colour_choice) ?? "—"}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFaDate(new Date(r.created_at).getTime())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-soft mt-5 p-4 sm:p-6">
          <h2 className="text-lg font-black">الگوی نوشتاری</h2>
          <p className="text-balance-fa mt-1 text-xs text-muted-foreground">
            الین هیچ‌وقت کودک را در گفت‌وگو تصحیح نمی‌کند؛ این بخش فقط برای شماست.
          </p>

          {spelling.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">هنوز نوشته‌ای تحلیل نشده است.</p>
          ) : (
            <div className="mt-4 grid gap-5">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="نیاز به تمرین" value={toFa(realIssues.length)} emoji="✍️" />
                <Stat label="نوشتار گفتاری" value={toFa(colloquial.length)} emoji="💬" />
                <Stat label="فاصله‌گذاری" value={toFa(spacing.length)} emoji="↔️" />
              </div>

              {pairs.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-bold">حروفی که بیشتر جابه‌جا می‌شوند</h3>
                  <ul className="flex flex-wrap gap-2">
                    {pairs.map((p) => (
                      <li
                        key={p.pair}
                        className="rounded-full bg-secondary px-4 py-2 text-sm font-bold"
                        dir="rtl"
                      >
                        {p.pair} <span className="text-muted-foreground">({toFa(p.count)} بار)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h3 className="mb-2 text-sm font-bold">نمونه‌های اخیر برای تمرین</h3>
                {realIssues.length === 0 ? (
                  <p className="text-sm text-muted-foreground">غلط املایی تازه‌ای ثبت نشده است. 🎉</p>
                ) : (
                  <ul className="grid gap-2">
                    {realIssues.slice(0, 8).map((r) => (
                      <li
                        key={r.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-secondary/60 p-3 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="font-bold text-destructive">{r.written_form}</span>
                          <span className="mx-2 text-muted-foreground">←</span>
                          <span className="font-bold text-success">{r.correct_form}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {r.child_name ? `${r.child_name} · ` : ""}
                            {formatFaDate(new Date(r.created_at).getTime())}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-card px-3 py-1 text-xs font-bold text-muted-foreground">
                          {r.error_type}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {colloquial.length > 0 ? (
                <div className="rounded-2xl border border-border p-3">
                  <h3 className="text-sm font-bold">نوشتار گفتاری — طبیعی در این سن، غلط نیست</h3>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {colloquial.slice(0, 10).map((r) => (
                      <li key={r.id} className="rounded-full bg-secondary px-3 py-1.5 text-xs">
                        {r.written_form} <span className="text-muted-foreground">({r.correct_form})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>


        <section className="card-soft mt-5 p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-black">جلسه‌های اخیر</h2>
          <ul className="grid gap-3">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-secondary/60 p-3"
              >
                <span className="shrink-0 text-2xl">{s.mood}</span>
                <span className="min-w-0">
                  <span className="block truncate font-bold">{s.topic}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.date} · {s.type}
                    {s.done ? " · تمام‌شده ✅" : ""}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-success/15 px-3 py-1 text-xs font-black text-success">
                  {s.score === null ? "بدون آزمون" : `${toFa(s.score)}٪`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="card-soft p-4 text-center">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
