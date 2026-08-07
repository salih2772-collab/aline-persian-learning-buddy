import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import alineMascot from "@/assets/aline.png";
import { AlineHeader } from "@/components/aline-header";
import { QuizCard } from "@/components/quiz-card";
import {
  DEFAULT_SETTINGS,
  FALLBACK_REPLIES,
  MOODS,
  MOOD_REPLIES,
  generateContent,
  loadSettings,
  saveQuizResult,
  type GeneratedContent,
  type Mood,
  type SessionSettings,
} from "@/lib/aline";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "گفت‌وگو با الین | داستان و درس" },
      {
        name: "description",
        content: "کودک با الین سلام می‌کند، حالش را می‌گوید و بعد داستان اخلاقی یا محتوای درسی دریافت می‌کند.",
      },
      { property: "og:title", content: "گفت‌وگو با الین | داستان و درس" },
      { property: "og:description", content: "مکالمهٔ سه‌مرحله‌ای کودکانه: سلام، احوال‌پرسی، محتوای یادگیری." },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: number; from: "aline" | "child"; text: string };
type Stage = "greeting" | "mood" | "content" | "quiz" | "free";

let msgId = 0;
const nextId = () => ++msgId;

function ChatPage() {
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SETTINGS);
  const [stage, setStage] = useState<Stage>("greeting");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<{ content: GeneratedContent; mood: Mood } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function push(from: Msg["from"], text: string) {
    setMessages((m) => [...m, { id: nextId(), from, text }]);
  }

  async function alineSays(texts: string[], delay = 900) {
    for (const t of texts) {
      setThinking(true);
      await new Promise((r) => setTimeout(r, delay));
      setThinking(false);
      push("aline", t);
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  async function startGreeting() {
    const name = settings.childName.trim();
    push("child", "سلام الین! 👋");
    await alineSays([
      `سلام ${name ? name + " جان" : "دوست خوبم"}! 🌼 خیلی خوشحالم که اومدی.`,
      "قبل از شروع بگو ببینم امروز حالت چطوره؟",
    ]);
    setStage("mood");
  }

  async function pickMood(mood: Mood) {
    const m = MOODS.find((x) => x.id === mood)!;
    push("child", `${m.emoji} ${m.label}`);
    setStage("content");
    const content = generateContent(settings, mood);
    setPending({ content, mood });
    await alineSays([MOOD_REPLIES[mood], ...content.messages], 1100);
    await alineSays(["حالا یک آزمون کوچولوی چندگزینه‌ای داریم. آماده‌ای؟ ✏️"], 800);
    setStage("quiz");
  }

  function finishQuiz(correct: number, total: number) {
    if (pending) {
      saveQuizResult({
        topic: pending.content.topic,
        type: pending.content.type,
        correct,
        total,
        score: Math.round((correct / total) * 100),
        mood: pending.mood,
      });
    }
    setStage("free");
  }

  async function sendFree(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    push("child", text);
    const reply = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)]!;
    await alineSays([reply], 900);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AlineHeader subtitle={settings.childName ? `همراهِ ${settings.childName}` : "همراه یادگیری"} />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-6 pb-4">
        <div className="flex-1 space-y-4">
          {messages.length === 0 && !thinking ? (
            <div className="card-soft flex flex-col items-center gap-4 p-8 text-center">
              <img
                src={alineMascot}
                alt="الین منتظر توست"
                width={512}
                height={512}
                className="animate-float h-28 w-28"
              />
              <p className="text-balance-fa text-muted-foreground">
                برای شروع، به الین سلام کن!
              </p>
              <button
                onClick={startGreeting}
                className="rounded-full bg-primary px-7 py-3 text-base font-black text-primary-foreground transition-opacity hover:opacity-90"
              >
                سلام الین! 👋
              </button>
              <Link to="/settings" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                تنظیمات جلسه را عوض کن
              </Link>
            </div>
          ) : null}

          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}

          {thinking ? <Thinking /> : null}
          <div ref={bottomRef} />
        </div>

        {stage === "mood" && !thinking ? (
          <div className="card-soft mt-4 p-4">
            <p className="mb-3 text-center text-sm font-bold">حالت امروز چطوره؟</p>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickMood(m.id)}
                  className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-2 transition-transform hover:-translate-y-1 hover:bg-secondary"
                >
                  <span className="text-2xl sm:text-3xl">{m.emoji}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground sm:text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {stage === "quiz" && pending && !thinking ? (
          <div className="mt-4">
            <QuizCard questions={pending.content.quiz} onFinish={finishQuiz} />
          </div>
        ) : null}

        {stage === "content" || stage === "free" ? (
          <form onSubmit={sendFree} className="mt-4 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="جوابت را بنویس..."
              className="min-w-0 flex-1 rounded-full border border-input bg-card px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={thinking}
              className="shrink-0 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              بفرست
            </button>
          </form>
        ) : null}
      </main>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isChild = msg.from === "child";
  return (
    <div className={`flex items-end gap-2 ${isChild ? "flex-row-reverse" : ""}`}>
      {!isChild ? (
        <img src={alineMascot} alt="" width={512} height={512} loading="lazy" className="h-8 w-8 shrink-0" />
      ) : (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-base">🧒</span>
      )}
      <div
        className={`max-w-[80%] whitespace-pre-line rounded-3xl px-4 py-3 text-sm leading-8 shadow-soft ${
          isChild
            ? "rounded-bl-md bg-bubble-child text-bubble-child-foreground"
            : "rounded-br-md border border-border bg-bubble-aline text-bubble-aline-foreground"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-end gap-2">
      <img src={alineMascot} alt="" width={512} height={512} loading="lazy" className="h-8 w-8 shrink-0" />
      <div className="flex items-center gap-2 rounded-3xl rounded-br-md border border-border bg-bubble-aline px-4 py-3 text-sm text-muted-foreground shadow-soft">
        <span className="thinking-dot h-2 w-2 rounded-full bg-primary" />
        <span className="thinking-dot h-2 w-2 rounded-full bg-primary [animation-delay:0.15s]" />
        <span className="thinking-dot h-2 w-2 rounded-full bg-primary [animation-delay:0.3s]" />
        الین در حال فکر کردن...
      </div>
    </div>
  );
}
