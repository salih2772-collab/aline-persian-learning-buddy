import { useState } from "react";
import { toFa, type QuizQuestion } from "@/lib/aline";

type Props = {
  questions: QuizQuestion[];
  onFinish: (correct: number, total: number) => void;
};

export function QuizCard({ questions, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index]!;
  const total = questions.length;

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    const isRight = i === q.correct;
    const nextCorrect = correctCount + (isRight ? 1 : 0);
    if (isRight) setCorrectCount(nextCorrect);
    window.setTimeout(() => {
      if (index + 1 < total) {
        setIndex(index + 1);
        setPicked(null);
      } else {
        setDone(true);
        onFinish(nextCorrect, total);
      }
    }, 1400);
  }

  if (done) {
    const score = Math.round((correctCount / total) * 100);
    const message =
      score >= 100
        ? "عالی بود! همهٔ جواب‌ها درست! 🏆"
        : score >= 60
          ? "خیلی خوب بود! کم‌کم حرفه‌ای می‌شوی. 🌟"
          : "اشکالی ندارد، با هم دوباره مرور می‌کنیم. 💛";
    return (
      <div className="card-soft p-5 text-center">
        <div className="text-5xl">🎉</div>
        <p className="mt-2 text-4xl font-black">{toFa(score)}٪</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {toFa(correctCount)} از {toFa(total)} پاسخ درست
        </p>
        <p className="mt-3 text-lg font-black">{message}</p>
      </div>
    );
  }

  return (
    <div className="card-soft p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-bold">آزمون کوتاه</span>
        <span>
          سؤال {toFa(index + 1)} از {toFa(total)}
        </span>
      </div>
      <p className="mb-4 text-xl font-black leading-9">{q.question}</p>
      <div className="grid gap-3">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.correct;
          let cls = "border-border bg-card hover:bg-secondary";
          if (picked !== null && isCorrect) cls = "border-success bg-success/15 text-success";
          else if (isPicked) cls = "border-destructive bg-destructive/10 text-destructive";
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`kid-target tap-bounce rounded-3xl border-2 px-5 py-4 text-right text-lg font-bold transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <p className="mt-4 text-center text-lg font-black">
          {picked === q.correct ? "آفرین! درست بود ✅" : "نزدیک بود؛ جواب درست را ببین 💡"}
        </p>
      ) : null}
    </div>
  );
}
