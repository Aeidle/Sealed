import { ShieldCheck, Lock, Star, Timer } from "lucide-react";
import { CreateSecret } from "@/components/create-secret";
import { SiteHeader } from "@/components/site-header";
import { HowItWorks } from "@/components/how-it-works";
import { PrivacyNote } from "@/components/privacy-note";
import { GithubIcon } from "@/components/icons/github";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/lib/site";

const TRUST = [
  { icon: Lock, label: "AES-256-GCM" },
  { icon: ShieldCheck, label: "Key never sent to us" },
  { icon: Timer, label: "One-time read" },
];

export default function Home() {
  return (
    <main className="app-backdrop min-h-screen pb-20">
      <SiteHeader />

      <div className="mx-auto w-full max-w-6xl px-5">
        {/* Two-column hero on desktop; stacks to a single column on mobile. */}
        <div className="grid items-start gap-10 pt-6 sm:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Left: the action */}
          <div className="enter flex flex-col gap-7">
            <header className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Share a secret, once.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground text-pretty">
                A link that self-destructs after a single read. Encrypted in your
                browser, never on our servers.
              </p>
            </header>

            <CreateSecret />

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {TRUST.map((t) => (
                <li key={t.label} className="flex items-center gap-1.5">
                  <t.icon className="size-3.5" />
                  {t.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: the info rail */}
          <aside className="enter flex flex-col gap-5 lg:pt-2">
            <HowItWorks variant="stack" />
            <PrivacyNote />
          </aside>
        </div>

        {/* Full-width open-source CTA */}
        <section className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
            Sealed is open source. Read the code, audit the encryption, or self-host
            your own instance.
          </p>
          <Button
            variant="outline"
            nativeButton={false}
            className="press gap-2"
            render={<a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" />}
          >
            <GithubIcon className="size-4" />
            Star on GitHub
            <Star className="size-4" />
          </Button>
        </section>

        <footer className="mt-14 text-center text-xs text-muted-foreground">
          The decryption key lives only in the link&apos;s <code>#</code> fragment. We
          never receive it.
        </footer>
      </div>
    </main>
  );
}
