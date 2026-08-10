import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlineHeader } from "@/components/aline-header";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "ورود والدین | الین" },
      {
        name: "description",
        content: "والدین با ایمیل و رمز عبور وارد می‌شوند تا جلسه‌های کودک و گزارش پیشرفت را مدیریت کنند.",
      },
      { property: "og:title", content: "ورود والدین | الین" },
      { property: "og:description", content: "ورود امن والدین به بخش بزرگ‌ترهای الین." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const fieldClass =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice("ایمیل تأیید برایتان ارسال شد. روی پیوند داخل ایمیل بزنید و بعد وارد شوید.");
          return;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ورود ممکن نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <AlineHeader subtitle="بخش والدین" />
      <main className="mx-auto w-full max-w-md px-4 pt-10">
        <h1 className="text-3xl font-black">
          {mode === "signin" ? "ورود والدین" : "ساخت حساب والد"}
        </h1>
        <p className="text-balance-fa mt-2 text-sm text-muted-foreground">
          کودکان وارد نمی‌شوند؛ فقط والد یا معلم روی همین دستگاه حساب می‌سازد.
        </p>

        <form className="card-soft mt-6 grid gap-4 p-5" onSubmit={submit}>
          <label className="grid gap-2">
            <span className="text-sm font-bold">ایمیل</span>
            <input
              className={fieldClass}
              type="email"
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold">رمز عبور</span>
            <input
              className={fieldClass}
              type="password"
              dir="ltr"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm font-bold text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm font-bold text-primary">{notice}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="kid-target flex w-full items-center justify-center rounded-full bg-primary px-6 text-lg font-black text-primary-foreground disabled:opacity-60"
          >
            {busy ? "کمی صبر کنید…" : mode === "signin" ? "ورود" : "ساخت حساب"}
          </button>

          <button
            type="button"
            className="text-sm font-bold text-muted-foreground underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "signin" ? "حساب ندارید؟ ثبت‌نام کنید" : "قبلاً حساب ساخته‌اید؟ وارد شوید"}
          </button>
        </form>
      </main>
    </div>
  );
}
