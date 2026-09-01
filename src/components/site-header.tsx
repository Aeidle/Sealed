import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { GithubIcon } from "@/components/icons/github";
import { GITHUB_URL } from "@/lib/site";

/** Top bar: wordmark on the left, GitHub link + theme switch on the right. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
      <Link
        href="/"
        className="press flex items-center gap-2 text-sm font-semibold tracking-tight"
      >
        <BrandMark className="size-7" />
        Sealed
      </Link>

      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          nativeButton={false}
          className="press grid size-9 place-items-center rounded-full bg-overlay text-muted-foreground ring-1 ring-hairline hover:scale-105 hover:text-foreground hover:ring-foreground/25"
          render={
            <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" aria-label="Sealed on GitHub" />
          }
        >
          <GithubIcon className="size-[18px]" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
