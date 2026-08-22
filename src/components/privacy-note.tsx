import { ShieldCheck } from "lucide-react";

/**
 * Trust callout explaining the zero-server-knowledge model. Every claim here is
 * true of the implementation: encryption/decryption run in the browser, the
 * server only ever holds ciphertext, the key rides in the URL fragment, and
 * secrets are deleted on read or on expiry.
 *
 * Layout-agnostic: the caller provides the section wrapper / width.
 */
export function PrivacyNote() {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-6 sm:flex-row sm:gap-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-overlay ring-1 ring-hairline">
        <ShieldCheck className="size-5" />
      </span>
      <div className="space-y-2">
        <h3 className="font-medium tracking-tight">Your data never leaves your browser unencrypted</h3>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Encryption and decryption happen entirely on your device with the Web
          Crypto API. We only ever store an encrypted blob we can&apos;t read, and
          the decryption key stays with you in the link&apos;s <code className="rounded bg-sunken px-1 py-0.5 font-mono text-xs">#</code> fragment,
          which is never transmitted to us. No accounts, no plaintext logs,
          nothing to leak. Each secret can be read once, then it&apos;s deleted, and
          anything unread self-destructs when it expires.
        </p>
      </div>
    </div>
  );
}
