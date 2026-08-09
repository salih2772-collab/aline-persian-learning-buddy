import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import alineMascot from "@/assets/aline.png";
import { AlineHeader } from "@/components/aline-header";
import { QuizCard } from "@/components/quiz-card";
import { chat, createSession, generateQuiz } from "@/lib/aline.functions";
import { analyzeSpelling } from "@/lib/spelling.functions";

import {
  DEFAULT_SETTINGS,
  MOODS,
  loadSettings,
  saveQuizResult,
  type Mood,
  type QuizQuestion,
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
type Stage = "start" | "mood" | "moodReason" | "talk" | "quiz" | "free";

let msgId = 0;
const nextId = () => ++msgId;

function ChatPage() {
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SETTINGS);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("start");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<{
    questions: QuizQuestion[];
    topic: string;
    type: "داستان" | "درس";
    mood: Mood;
  } | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const startSession = useServerFn(createSession);
  const sendChat = useServerFn(chat);
  const makeQuiz = useServerFn(generateQuiz);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function push(from: Msg["from"], text: string) {
    setMessages((m) => [...m, { id: nextId(), from, text }]);
  }

  async function talk(
    id: string,
    userMessage: string,
    moodSticker: string | null = null,
    moodReason: string | null = null,
  ) {
    setThinking(true);
    setError(null);
    try {
      const reply = await sendChat({ data: { sessionId: id, userMessage, moodSticker, moodReason } });
      push("aline", [reply.message, reply.question].filter(Boolean).join("\n\n"));
      return reply.phase;
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارتباط با الین برقرار نشد.");
      return null;
    } finally {
      setThinking(false);
    }
  }

  async function begin() {
    push("child", "سلام الین! 👋");
    setThinking(true);
    setError(null);
    let id: string;
    try {
      const useBook = settings.contentType === "lesson" || settings.useBookInStory;
      const s = await startSession({
        data: {
          student_name: settings.childName,
          content_type: settings.contentType,
          book: useBook ? settings.book : null,
          chapter: null,
          page: useBook ? settings.page : null,
          moral_topic: settings.contentType === "story" ? settings.moralTopic : null,
        },
      });
      id = s.sessionId;
      setSessionId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "شروع جلسه ممکن نشد.");
      setThinking(false);
      return;
    }
    setThinking(false);
    const phase = await talk(id, "سلام الین!");
    if (phase) setStage("mood");
  }

  async function pickMood(mood: Mood) {
    if (!sessionId) return;
    const m = MOODS.find((x) => x.id === mood)!;
    push("child", `${m.emoji} ${m.label}`);
    setMood(mood);
    setStage("moodReason");
    // Always ask the child why they feel this way before moving on.
    push("aline", `${m.emoji} ممنون که گفتی!\n\nچرا امروز این حس رو داری؟ برام تعریف کن 💛`);
  }

  async function sendFree(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking || !sessionId) return;
    setInput("");
    push("child", text);

    if (stage === "moodReason" && mood) {
      const phase = await talk(sessionId, text, mood, text);
      if (!phase) return;
      setStage("talk");
      return;
    }

    const phase = await talk(sessionId, text);
    if (phase === "content" && stage === "talk" && mood) {
      // Build the quiz from the story/lesson Aline just gave.
      setThinking(true);
      try {
        const quiz = await makeQuiz({ data: { sessionId } });
        setPending({ ...quiz, type: quiz.type as "داستان" | "درس", mood });
        setStage("quiz");
      } catch {
        setStage("free");
      } finally {
        setThinking(false);
      }
    }
  }

  function finishQuiz(correct: number, total: number) {
    if (pending) {
      saveQuizResult({
        topic: pending.topic,
        type: pending.type,
        correct,
        total,
        score: Math.round((correct / total) * 100),
        mood: pending.mood,
      });
    }
    setStage("free");
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
              <p className="text-balance-fa text-muted-foreground">برای شروع، به الین سلام کن!</p>
              <button
                onClick={begin}
                className="rounded-full bg-primary px-7 py-3 text-base font-black text-primary-foreground transition-opacity hover:opacity-90"
              >
                سلام الین! 👋
              </button>
            </div>
          ) : null}

          {messages.map((m) => (
            <Bubble key={m.id} msg={m} />
          ))}

          {thinking ? <Thinking /> : null}

          {error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

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
            <QuizCard questions={pending.questions} onFinish={finishQuiz} />
          </div>
        ) : null}

        {stage === "moodReason" || stage === "talk" || stage === "free" ? (
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
