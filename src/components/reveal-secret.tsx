"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";
import { CountdownRingButton } from "@/components/countdown-ring-button";
import { decryptSecret } from "@/lib/crypto";
import { parsePayload, type SecretPayload } from "@/lib/secret-types";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "revealed" | "error";

export function RevealSecret({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [payload, setPayload] = useState<SecretPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reveal = useCallback(async () => {
    setStatus("loading");
    setError(null);

    // The key + IV live in the URL fragment and are never sent to the server.
    const fragment = window.location.hash.replace(/^#/, "");
    if (!fragment) {
      setError("This link is missing its decryption key.");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch(`/api/secret/${id}`, { cache: "no-store" });
      if (res.status === 404) {
        throw new Error("This secret has already been read or has expired.");
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const { ciphertext } = (await res.json()) as { ciphertext: string };
      const plaintext = await decryptSecret(ciphertext, fragment);
      setPayload(parsePayload(plaintext));
      setStatus("revealed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not decrypt this secret.");
      setStatus("error");
    }
  }, [id]);

  if (status === "revealed" && payload) {
    return (
      <GlassCard>
        <div className="materialize">
          <RevealedPayload payload={payload} />
        </div>
      </GlassCard>
    );
  }

  if (status === "error") {
    return (
      <GlassCard>
        <div className="materialize flex flex-col items-center gap-4 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-destructive/15 ring-1 ring-destructive/30">
            <AlertTriangle className="size-6 text-destructive-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Nothing to see here</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="ghost" className="press" onClick={() => router.push("/")}>
            Create a new secret
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Someone shared a secret with you</h2>
          <p className="text-sm text-muted-foreground">
            Reveal it once. As soon as you open it, it&apos;s deleted from the server for good.
          </p>
        </div>

        {status === "loading" ? (
          <div className="grid size-[132px] place-items-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CountdownRingButton onComplete={reveal} label="Reveal" armingLabel="Revealing…" />
        )}

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="size-3.5" />
          One-time view, decrypted in your browser
        </p>
      </div>
    </GlassCard>
  );
}

function RevealedPayload({ payload }: { payload: SecretPayload }) {
  switch (payload.type) {
    case "text":
      return (
        <div className="space-y-3">
          <SecretHeading />
          <CopyableBlock value={payload.text}>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm">{payload.text}</pre>
          </CopyableBlock>
        </div>
      );
    case "link":
      return (
        <div className="space-y-3">
          <SecretHeading />
          <CopyableBlock value={payload.url}>
            <a
              href={payload.url}
              className="break-all font-mono text-sm text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
              rel="noreferrer noopener"
            >
              {payload.url}
            </a>
          </CopyableBlock>
        </div>
      );
    case "login":
      return (
        <div className="space-y-3">
          <SecretHeading />
          <FieldRow label="Username" value={payload.username} />
          <FieldRow label="Password" value={payload.password} mono />
          {payload.url && <FieldRow label="URL" value={payload.url} />}
        </div>
      );
    case "card":
      return (
        <div className="space-y-3">
          <SecretHeading />
          <FieldRow label="Card number" value={payload.number} mono />
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Expiry" value={payload.expiry} mono />
            <FieldRow label="CVC" value={payload.cvc} mono />
          </div>
          {payload.name && <FieldRow label="Name" value={payload.name} />}
        </div>
      );
  }
}

function SecretHeading() {
  return (
    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Check className="size-4 text-emerald-400" />
      Decrypted. This secret is now gone from the server.
    </div>
  );
}

function CopyableBlock({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-hairline bg-sunken p-4">
      <div className="pr-10">{children}</div>
      <CopyButton value={value} className="absolute right-2 top-2" />
    </div>
  );
}

function FieldRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-hairline bg-sunken p-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <span className={mono ? "break-all font-mono text-sm" : "break-all text-sm"}>{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("press", className)}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy"
    >
      {copied ? (
        <Check key="check" className="pop size-4 text-emerald-400" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
}
