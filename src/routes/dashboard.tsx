import { createFileRoute } from "@tanstack/react-router";
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
  MOOD_DISTRIBUTION,
  RECENT_SESSIONS,
  WEEKLY_ACTIVITY,
  formatFaDate,
  loadQuizResults,
  toFa,
  type QuizResult,
} from "@/lib/aline";

export const Route = createFileRoute("/dashboard")({
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

function DashboardPage() {
  const [quizzes, setQuizzes] = useState<QuizResult[]>([]);

  useEffect(() => {
    setQuizzes(loadQuizResults());
  }, []);

  const totalMinutes = WEEKLY_ACTIVITY.reduce((a, d) => a + d.minutes, 0);
  const totalSessions = WEEKLY_ACTIVITY.reduce((a, d) => a + d.sessions, 0);

  const scoreSource = quizzes.length > 0 ? quizzes.map((q) => q.score) : RECENT_SESSIONS.map((s) => s.score);
  const avgScore = Math.round(scoreSource.reduce((a, s) => a + s, 0) / scoreSource.length);

  const trend = quizzes.slice(-8).map((q, i) => ({
    label: `${toFa(i + 1)}`,
    score: q.score,
  }));

  const realSessions = [...quizzes].reverse().map((q) => ({
    id: `q-${q.id}`,
    date: formatFaDate(q.at),
    type: q.type,
    topic: q.topic,
    mood: MOODS.find((m) => m.id === q.mood)?.emoji ?? "🙂",
    score: q.score,
  }));
  const mockSessions = RECENT_SESSIONS.map((s) => ({ ...s, id: `m-${s.id}` }));
  const sessions = [...realSessions, ...mockSessions].slice(0, 8);

  return (
    <div className="min-h-screen pb-16">
      <AlineHeader subtitle="داشبورد والدین و معلمان" />
      <main className="mx-auto w-full max-w-3xl px-4 pt-8">
        <h1 className="text-3xl font-black">پیشرفت این هفته</h1>
        <p className="mt-2 text-sm text-muted-foreground">خلاصه‌ای از جلسه‌های کودک با الین.</p>

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
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-success/15 px-3 py-1 text-xs font-black text-success">
                  {toFa(s.score)}٪
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
