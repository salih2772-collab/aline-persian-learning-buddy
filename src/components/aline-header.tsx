import { Link } from "@tanstack/react-router";
import alineMascot from "@/assets/aline.png";

export function AlineHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-5 sm:flex sm:justify-between">
      <Link to="/" className="flex min-w-0 items-center gap-3">
        <img
          src={alineMascot}
          alt="الین"
          width={512}
          height={512}
          loading="lazy"
          className="h-11 w-11 shrink-0"
        />
        <span className="min-w-0">
          <span className="block truncate text-lg font-black">الین</span>
          {subtitle ? (
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
      </Link>
    </header>
  );
}
