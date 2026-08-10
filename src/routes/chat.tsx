import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import alineMascot from "@/assets/aline.png";
import { AlineHeader } from "@/components/aline-header";
import { QuizCard } from "@/components/quiz-card";
import { chat, completeSession, createSession, generateQuiz } from "@/lib/aline.functions";
import { analyzeSpelling } from "@/lib/spelling.functions";

import {
  DEFAULT_SETTINGS,
  MOODS,
  loadSettings,
  saveQuizResult,
  toFa,
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
type Stage = "start" | "mood" | "moodReason" | "talk" | "quiz" | "free" | "done";

let msgId = 0;
const nextId = () => ++msgId;

function ChatPage() {
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SETTINGS);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("start");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<{
    questions: QuizQuestion[];
    topic: string;
    type: "داستان" | "درس";
    mood: Mood;
  } | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const startSession = useServerFn(createSession);
  const sendChat = useServerFn(chat);
  const makeQuiz = useServerFn(generateQuiz);
  const endSession = useServerFn(completeSession);
  const checkSpelling = useServerFn(analyzeSpelling);

  // Child messages are collected during the session and analysed once at the end
  // (one API call per session instead of one per message). Never shown to the child.
  const childTexts = useRef<string[]>([]);
  const spellingDone = useRef(false);

  function runBatchedSpellingCheck(id: string) {
    if (spellingDone.current) return;
    spellingDone.current = true;
    if (!settings.spellingAnalysis) return;
    const text = childTexts.current.join("\n").trim();
    if (!text) return;
    void checkSpelling({ data: { sessionId: id, text } }).catch(() => {});
  }



  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function push(from: Msg["from"], text: string) {
    setMessages((m) => [...m, { id: nextId(), from, text }]);
  }

  // Runs an action; on failure clears the thinking state and offers a retry.
  async function run(action: () => Promise<void>) {
    setError(null);
    setRetry(null);
    try {
      await action();
    } catch (e) {
      setThinking(false);
      setError(e instanceof Error ? e.message : "الین الان نتونست جواب بده، دوباره امتحان کن.");
      setRetry(() => () => void run(action));
    } finally {
      setThinking(false);
    }
  }

  async function talk(
    id: string,
    userMessage: string,
    moodSticker: string | null = null,
    moodReason: string | null = null,
    finish = false,
  ) {
    setThinking(true);
    try {
      const reply = await sendChat({
        data: { sessionId: id, userMessage, moodSticker, moodReason, finish },
      });
      push("aline", [reply.message, reply.question].filter(Boolean).join("\n\n"));
      return reply;
    } finally {
      setThinking(false);
    }
  }

  async function begin() {
    push("child", "سلام الین! 👋");
    await run(async () => {
      let id = sessionId;
      if (!id) {
        setThinking(true);
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
        setThinking(false);
      }
      const reply = await talk(id, "سلام الین!");
      if (reply.phase) setStage("mood");
    });
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

  /** Builds the end-of-session quiz; falls back to the closing screen if it fails. */
  async function startQuiz(id: string, skipQuiz = false) {
    runBatchedSpellingCheck(id);
    if (skipQuiz) {
      await endSession({ data: { sessionId: id, correct: null, total: null } }).catch(() => {});
      setStage("done");
      return;
    }
    setThinking(true);
    try {
      const quiz = await makeQuiz({ data: { sessionId: id } });
      if (quiz.questions.length === 0) throw new Error("empty");
      setPending({ ...quiz, type: quiz.type as "داستان" | "درس", mood: mood ?? "happy" });
      setStage("quiz");
    } catch {
      // The quiz is optional — never block the child on it.
      await endSession({ data: { sessionId: id, correct: null, total: null } }).catch(() => {});
      setStage("done");
    } finally {
      setThinking(false);
    }
  }


  /** "تمام شد" — the child can end the session at any moment. */
  async function finishNow() {
    if (!sessionId || thinking) return;
    push("child", "تمام شد ✋");
    await run(async () => {
      await talk(sessionId, "دیگه کافیه، تمام شد.", null, null, true);
      await startQuiz(sessionId);
    });
  }

  async function sendFree(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking || !sessionId) return;
    setInput("");
    push("child", text);
    childTexts.current.push(text);

    const wasMoodReason = stage === "moodReason";

    await run(async () => {
      if (wasMoodReason && mood) {
        await talk(sessionId, text, mood, text);
        setStage("talk");
        return;
      }

      const reply = await talk(sessionId, text);
      if (reply.wrapUp) await startQuiz(sessionId);
    });
  }

  async function finishQuiz(correct: number, total: number) {
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
    setResult({ correct, total });
    if (sessionId) {
      await endSession({ data: { sessionId, correct, total } }).catch(() => {});
    }
    setStage("done");
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
              <p className="text-balance-fa text-lg text-muted-foreground">برای شروع، به الین سلام کن!</p>
              <button
                onClick={begin}
                className="kid-target tap-bounce rounded-full bg-primary px-9 text-xl font-black text-primary-foreground hover:opacity-90"
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
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="text-balance-fa">{error}</span>
              {retry ? (
                <button
                  type="button"
                  onClick={retry}
                  disabled={thinking}
                  className="kid-target tap-bounce rounded-full bg-primary px-6 text-base font-black text-primary-foreground disabled:opacity-50"
                >
                  دوباره امتحان کن 🔁
                </button>
              ) : null}
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {stage === "mood" && !thinking ? (
          <div className="card-soft mt-4 p-4">
            <p className="mb-4 text-center text-xl font-black">حالت امروز چطوره؟</p>
            <div className="flex flex-wrap items-start justify-center gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickMood(m.id)}
                  aria-label={m.label}
                  className="tap-bounce flex w-[68px] flex-col items-center gap-2 sm:w-[84px]"
                >
                  <span className="grid h-[68px] w-[68px] place-items-center rounded-full border-2 border-border bg-secondary text-4xl shadow-soft transition-colors hover:bg-accent/30 sm:h-[84px] sm:w-[84px] sm:text-5xl">
                    {m.emoji}
                  </span>
                  <span className="text-xs font-bold leading-tight text-muted-foreground sm:text-sm">{m.label}</span>
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

        {stage === "done" ? (
          <div className="card-soft mt-4 flex flex-col items-center gap-3 p-6 text-center">
            <img src={alineMascot} alt="" width={512} height={512} className="animate-float h-24 w-24" />
            <p className="text-2xl font-black">آفرین {settings.childName || "دوست خوبم"}! 🌟</p>
            <p className="text-balance-fa text-base leading-8 text-muted-foreground">
              امروز با هم {settings.contentType === "lesson" ? "درس خوندیم" : "یک داستان قشنگ خوندیم"}، حرف زدیم
              {result ? ` و در آزمون ${toFa(result.correct)} از ${toFa(result.total)} سؤال رو درست جواب دادی` : ""}.
              فردا هم منتظرتم! 💛
            </p>
            <a
              href="/"
              className="kid-target tap-bounce flex items-center rounded-full bg-primary px-9 text-xl font-black text-primary-foreground hover:opacity-90"
            >
              خداحافظ الین 👋
            </a>
          </div>
        ) : null}

        {stage === "moodReason" || stage === "talk" || stage === "free" ? (
          <>
            <form onSubmit={sendFree} className="mt-4 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="جوابت را بنویس..."
                className="kid-target min-w-0 flex-1 rounded-full border-2 border-input bg-card px-5 text-base outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={thinking}
                className="kid-target tap-bounce shrink-0 rounded-full bg-primary px-6 text-base font-black text-primary-foreground disabled:opacity-50"
              >
                بفرست
              </button>
            </form>
            <button
              type="button"
              onClick={finishNow}
              disabled={thinking}
              className="kid-target tap-bounce mt-3 self-center rounded-full border-2 border-border bg-card px-7 text-base font-black text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              تمام شد ✋
            </button>
          </>
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
        className={`max-w-[82%] whitespace-pre-line rounded-3xl px-5 py-4 text-base leading-9 shadow-soft ${
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
