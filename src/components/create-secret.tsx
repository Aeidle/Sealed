"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Dices,
  Eye,
  EyeOff,
  Hash,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/glass-card";
import { SegmentedControl } from "@/components/segmented-control";
import { encryptSecret, type EncryptOptions } from "@/lib/crypto";
import { generateCode, generatePassphrase } from "@/lib/passphrase";
import { SECRET_TYPES, serializePayload, type SecretPayload, type SecretType } from "@/lib/secret-types";
import { EXPIRY_OPTIONS, type ExpiryOption } from "@/lib/redis";
import { cn } from "@/lib/utils";

type Protection = "off" | "passphrase" | "code";

const PROTECTION_OPTIONS = [
  { id: "off" as const, label: "None", icon: ShieldOff },
  { id: "passphrase" as const, label: "Passphrase", icon: KeyRound },
  { id: "code" as const, label: "Code", icon: Hash },
];

const EXPIRY_LABELS: Record<ExpiryOption, string> = {
  "5m": "5 minutes",
  "1h": "1 hour",
  "1d": "1 day",
  "7d": "7 days",
};

interface FormState {
  text: string;
  url: string;
  username: string;
  password: string;
  loginUrl: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
}

const EMPTY_FORM: FormState = {
  text: "",
  url: "",
  username: "",
  password: "",
  loginUrl: "",
  cardNumber: "",
  cardExpiry: "",
  cardCvc: "",
  cardName: "",
};

function buildPayload(type: SecretType, form: FormState): SecretPayload | null {
  switch (type) {
    case "text":
      return form.text.trim() ? { type, text: form.text } : null;
    case "link":
      return form.url.trim() ? { type, url: form.url.trim() } : null;
    case "login":
      return form.username.trim() && form.password
        ? {
            type,
            username: form.username.trim(),
            password: form.password,
            url: form.loginUrl.trim() || undefined,
          }
        : null;
    case "card":
      return form.cardNumber.trim() && form.cardExpiry.trim() && form.cardCvc.trim()
        ? {
            type,
            number: form.cardNumber.trim(),
            expiry: form.cardExpiry.trim(),
            cvc: form.cardCvc.trim(),
            name: form.cardName.trim() || undefined,
          }
        : null;
  }
}

/** Digits only, max 16, grouped in 4s: "4242 4242 4242 4242". */
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

/** Digits only, "MM/YY" with the slash inserted after 2 digits. */
function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Digits only, max 3. */
function formatCvc(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

export function CreateSecret() {
  const [type, setType] = useState<SecretType>("text");
  const [expiry, setExpiry] = useState<ExpiryOption>("1h");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Bumped on each rejected submit so the error line remounts and replays shake.
  const [shakeKey, setShakeKey] = useState(0);
  const [protection, setProtection] = useState<Protection>("off");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function fail(message: string) {
    setError(message);
    setShakeKey((k) => k + 1);
  }

  function changeProtection(next: Protection) {
    setProtection(next);
    setError(null);
    // A code is meant to be read aloud, so generate + show it. A passphrase
    // starts empty for the user to type or generate.
    setPassword(next === "code" ? generateCode() : "");
    setShowPassword(next === "passphrase");
  }

  async function handleSubmit() {
    setError(null);
    const payload = buildPayload(type, form);
    if (!payload) {
      fail("Fill in the secret before creating a link.");
      return;
    }
    if (protection === "passphrase" && password.trim().length < 4) {
      fail("Use a passphrase of at least 4 characters.");
      return;
    }

    setBusy(true);
    try {
      const options: EncryptOptions =
        protection === "off"
          ? {}
          : { password, mode: protection === "code" ? "code" : "passphrase" };
      const { ciphertext, fragment } = await encryptSecret(serializePayload(payload), options);
      const res = await fetch("/api/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext, expiry }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const { id } = (await res.json()) as { id: string };
      setShareUrl(`${window.location.origin}/s/${id}#${fragment}`);
    } catch (err) {
      fail(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(password);
    setCopiedPw(true);
    setTimeout(() => setCopiedPw(false), 1800);
  }

  function reset() {
    setShareUrl(null);
    setForm(EMPTY_FORM);
    setError(null);
    setCopied(false);
    setProtection("off");
    setPassword("");
    setShowPassword(false);
  }

  if (shareUrl) {
    return (
      <GlassCard>
        <div className="materialize flex flex-col items-center gap-5 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-overlay ring-1 ring-hairline">
            <ShieldCheck className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Your secret link is ready</h2>
            <p className="text-sm text-muted-foreground">
              It can be opened once, then it&apos;s gone forever. Expires in {EXPIRY_LABELS[expiry]}.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 rounded-xl border border-hairline bg-sunken p-2 pl-3">
            <Link2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-left font-mono text-xs text-foreground/90">
              {shareUrl}
            </span>
            <Button size="sm" onClick={copyLink} className="press shrink-0">
              {copied ? (
                <Check key="check" className="pop size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {protection !== "off" && (
            <div className="w-full space-y-3 rounded-2xl border border-hairline bg-card p-5 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                <KeyRound className="size-3.5" />
                {protection === "code" ? "One-time code" : "Passphrase"}
                <span aria-hidden>·</span> Share separately
              </div>
              <p
                className={cn(
                  "break-all font-mono text-foreground",
                  protection === "code" ? "text-2xl tracking-[0.3em] tabular-nums" : "text-lg",
                )}
              >
                {password}
              </p>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="press gap-1.5"
                  onClick={copyPassword}
                >
                  {copiedPw ? (
                    <Check key="check" className="pop size-4 text-emerald-400" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  {copiedPw ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                The recipient needs this to open the secret. Send it a different way than the
                link, and we never store it, so if it&apos;s lost the secret can&apos;t be recovered.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            The decryption key lives only in this link&apos;s <code>#</code> fragment. We never
            receive it.
          </p>

          <Button variant="ghost" onClick={reset} className="press gap-2">
            <Plus className="size-4" />
            Create another
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="space-y-6">
        <SegmentedControl
          options={SECRET_TYPES}
          value={type}
          onChange={(next) => {
            setType(next);
            setError(null);
          }}
        />

        <div key={type} className="swap space-y-4">
          {type === "text" && (
            <Field label="Secret text">
              <Textarea
                value={form.text}
                onChange={(e) => update("text", e.target.value)}
                placeholder="Paste the message, note, or token you want to share once…"
                className="min-h-32 resize-none bg-sunken"
                autoFocus
              />
            </Field>
          )}

          {type === "link" && (
            <Field label="URL">
              <Input
                value={form.url}
                onChange={(e) => update("url", e.target.value)}
                placeholder="https://example.com/private"
                inputMode="url"
                className="bg-sunken"
                autoFocus
              />
            </Field>
          )}

          {type === "login" && (
            <>
              <Field label="Username">
                <Input
                  value={form.username}
                  onChange={(e) => update("username", e.target.value)}
                  placeholder="jane@example.com"
                  className="bg-sunken"
                  autoFocus
                />
              </Field>
              <Field label="Password">
                <Input
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  type="password"
                  placeholder="••••••••••"
                  className="bg-sunken"
                />
              </Field>
              <Field label="URL (optional)">
                <Input
                  value={form.loginUrl}
                  onChange={(e) => update("loginUrl", e.target.value)}
                  placeholder="https://service.example.com"
                  inputMode="url"
                  className="bg-sunken"
                />
              </Field>
            </>
          )}

          {type === "card" && (
            <>
              <Field label="Card number">
                <Input
                  value={form.cardNumber}
                  onChange={(e) => update("cardNumber", formatCardNumber(e.target.value))}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  maxLength={19}
                  className="bg-sunken font-mono"
                  autoFocus
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Expiry">
                  <Input
                    value={form.cardExpiry}
                    onChange={(e) => update("cardExpiry", formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    maxLength={5}
                    className="bg-sunken font-mono"
                  />
                </Field>
                <Field label="CVC">
                  <Input
                    value={form.cardCvc}
                    onChange={(e) => update("cardCvc", formatCvc(e.target.value))}
                    placeholder="123"
                    inputMode="numeric"
                    maxLength={3}
                    className="bg-sunken font-mono"
                  />
                </Field>
              </div>
              <Field label="Name on card (optional)">
                <Input
                  value={form.cardName}
                  onChange={(e) => update("cardName", e.target.value)}
                  placeholder="Jane Doe"
                  className="bg-sunken"
                />
              </Field>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Expires after</Label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(EXPIRY_OPTIONS) as ExpiryOption[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setExpiry(opt)}
                className={cn(
                  "press rounded-lg border py-2 text-sm font-medium",
                  expiry === opt
                    ? "border-hairline bg-card text-foreground shadow-sm"
                    : "border-transparent bg-sunken text-muted-foreground hover:text-foreground",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">Password protection</Label>
          <SegmentedControl
            options={PROTECTION_OPTIONS}
            value={protection}
            onChange={changeProtection}
          />

          {protection === "passphrase" && (
            <div className="swap space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Type or generate a passphrase"
                    className="bg-sunken pr-9 font-mono"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="press absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="press shrink-0 gap-1.5"
                  onClick={() => {
                    setPassword(generatePassphrase());
                    setShowPassword(true);
                  }}
                >
                  <Dices className="size-4" />
                  <span className="hidden sm:inline">Generate</span>
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Recommended for sensitive secrets. Share it separately from the link.
              </p>
            </div>
          )}

          {protection === "code" && (
            <div className="swap space-y-3">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                {password.split("").map((digit, i) => (
                  <div
                    key={i}
                    className="grid size-10 place-items-center rounded-lg border border-hairline bg-sunken font-mono text-lg text-foreground shadow-sm tabular-nums sm:size-11"
                  >
                    {digit}
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="press gap-1.5"
                  onClick={() => setPassword(generateCode())}
                >
                  <RefreshCw className="size-3.5" />
                  Regenerate
                </Button>
              </div>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                A short code to share by voice or a separate message. Convenient, but weaker
                than a passphrase.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p
            key={shakeKey}
            className="shake rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground"
          >
            {error}
          </p>
        )}

        <Button onClick={handleSubmit} disabled={busy} className="press w-full gap-2" size="lg">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
          {busy ? "Encrypting…" : "Encrypt & create link"}
        </Button>
      </div>
    </GlassCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
