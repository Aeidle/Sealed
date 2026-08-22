import { KeyRound, Link2, Timer } from "lucide-react";

const STEPS = [
  {
    icon: KeyRound,
    title: "Encrypted on your device",
    body: "Your secret is encrypted with AES-256-GCM in your browser using the Web Crypto API. The plaintext never leaves this page.",
  },
  {
    icon: Link2,
    title: "The key stays in the link",
    body: "We store only the ciphertext. The decryption key travels in the link's # fragment, which browsers never send to a server, so we never receive it.",
  },
  {
    icon: Timer,
    title: "Opens once, then it's gone",
    body: "The first open reads the secret and deletes it from the server in the same step. Anything unopened self-destructs when it expires.",
  },
];

/**
 * "How it works" steps. `variant`:
 *  - "grid"  — three cards in a row (below-the-fold section).
 *  - "stack" — a vertical list (side rail in the two-column hero).
 * Layout-agnostic: the caller provides the section wrapper / width.
 */
export function HowItWorks({ variant = "grid" }: { variant?: "grid" | "stack" }) {
  if (variant === "stack") {
    return (
      <div className="space-y-3">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          How it works
        </h2>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="glass flex gap-3 rounded-2xl p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-overlay ring-1 ring-hairline">
                <step.icon className="size-[1.125rem]" />
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-medium tracking-tight">
                  <span className="text-muted-foreground tabular-nums">{i + 1}. </span>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-center text-sm font-medium tracking-wide text-muted-foreground uppercase">
        How it works
      </h2>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="glass flex flex-col gap-3 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-overlay ring-1 ring-hairline">
                <step.icon className="size-[1.125rem]" />
              </span>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                Step {i + 1}
              </span>
            </div>
            <h3 className="font-medium tracking-tight">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
