import { createFileRoute, Link } from "@tanstack/react-router";
import alineMascot from "@/assets/aline.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الین | انتخاب نقش کودک یا والد" },
      {
        name: "description",
        content: "با الین شروع کن: کودک برای داستان و درس، والد برای تنظیم جلسه و دیدن پیشرفت.",
      },
      { property: "og:title", content: "الین | انتخاب نقش کودک یا والد" },
      {
        property: "og:description",
        content: "دستیار فارسی کودکان دبستانی برای داستان اخلاقی، مرور درس و گزارش پیشرفت.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <img
          src={alineMascot}
          alt="شخصیت الین، جغد مهربان یادگیری"
          width={512}
          height={512}
          className="animate-float mx-auto h-36 w-36 sm:h-44 sm:w-44"
        />
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">سلام! من الین هستم 👋</h1>
        <p className="text-balance-fa mx-auto mt-3 max-w-md text-muted-foreground">
          با هم داستان‌های قشنگ می‌خوانیم، درس‌ها را مرور می‌کنیم و سؤال‌های جالب می‌پرسیم.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Link
          to="/chat"
          className="card-soft group flex flex-col items-center gap-3 p-7 text-center transition-transform hover:-translate-y-1 hover:shadow-pop"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-3xl">🧒</span>
          <span className="text-xl font-black">من کودک هستم</span>
          <span className="text-sm text-muted-foreground">بریم با الین حرف بزنیم!</span>
          <span className="mt-1 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">
            شروع گفت‌وگو
          </span>
        </Link>

        <Link
          to="/settings"
          className="card-soft group flex flex-col items-center gap-3 p-7 text-center transition-transform hover:-translate-y-1 hover:shadow-pop"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-accent/25 text-3xl">👩‍🏫</span>
          <span className="text-xl font-black">والد یا معلم</span>
          <span className="text-sm text-muted-foreground">تنظیم جلسه و دیدن پیشرفت</span>
          <span className="mt-1 rounded-full bg-accent px-5 py-2 text-sm font-bold text-accent-foreground">
            ورود به بخش بزرگ‌ترها
          </span>
        </Link>
      </div>

      <Link to="/dashboard" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        مشاهدهٔ داشبورد پیشرفت →
      </Link>
    </main>
  );
}
