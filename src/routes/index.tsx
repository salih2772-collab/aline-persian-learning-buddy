import { createFileRoute, Link } from "@tanstack/react-router";
import alineMascot from "@/assets/aline.png";
import childCard from "@/assets/role-child.jpg";
import parentCard from "@/assets/role-parent.jpg";

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

      <div className="grid w-full gap-5 sm:grid-cols-2">
        <Link
          to="/chat"
          aria-label="من کودک هستم — شروع گفت‌وگو با الین"
          className="card-soft tap-bounce group flex flex-col items-center gap-4 overflow-hidden p-4 text-center hover:shadow-pop"
        >
          <img
            src={childCard}
            alt="کودکی با کوله‌پشتی که دست تکان می‌دهد"
            width={816}
            height={816}
            className="h-[210px] w-full rounded-3xl bg-card object-contain sm:h-[240px]"
          />
          <span className="text-3xl font-black leading-tight">من کودک هستم</span>
          <span className="kid-target flex w-full items-center justify-center rounded-full bg-primary px-6 text-xl font-black text-primary-foreground">
            بریم حرف بزنیم!
          </span>
        </Link>

        <Link
          to="/dashboard"
          aria-label="والد یا معلم — تنظیم جلسه و دیدن پیشرفت"
          className="card-soft tap-bounce group flex flex-col items-center gap-4 overflow-hidden p-4 text-center hover:shadow-pop"
        >
          <img
            src={parentCard}
            alt="بزرگ‌تری با دفتر گزارش و فنجان چای"
            width={816}
            height={816}
            loading="lazy"
            className="h-[210px] w-full rounded-3xl bg-card object-contain sm:h-[240px]"
          />
          <span className="text-3xl font-black leading-tight">والد یا معلم</span>
          <span className="kid-target flex w-full items-center justify-center rounded-full bg-accent px-6 text-xl font-black text-accent-foreground">
            بخش بزرگ‌ترها
          </span>
        </Link>
      </div>


    </main>
  );
}
