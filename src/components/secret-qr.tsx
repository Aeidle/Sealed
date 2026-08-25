"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toBlob, toPng } from "html-to-image";
import { Check, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Web Share w/ files, resolved client-side (false on the server). */
function useCanShareFiles(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && typeof navigator.canShare === "function",
    () => false,
  );
}

/** Split-S mark, fixed white-on-dark so it reads on the white card. */
function CardMark() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#111113]">
      <svg viewBox="26 24 54 52" className="size-[64%]" fill="#ffffff" aria-hidden>
        <path d="M 68 30 H 42 C 34 30 30 36 30 42 V 46 H 54 C 58 46 60 44 60 40 H 42 V 36 H 68 V 30 Z" />
        <path d="M 38 70 H 64 C 72 70 76 64 76 58 V 54 H 52 C 48 54 46 56 46 60 H 64 V 64 H 38 V 70 Z" />
      </svg>
    </span>
  );
}

/**
 * A branded QR card for a share link. Generated entirely in the browser — the QR
 * encodes the full link *including* the `#fragment` (the key), so it must never
 * be built server-side. The card is always light (dark-on-white) so it scans in
 * any theme, and what's shown is exactly what downloads / shares.
 */
export function SecretQr({ value }: { value: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const canShare = useCanShareFiles();

  const opts = { pixelRatio: 3, cacheBust: true };

  async function download() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const url = await toPng(cardRef.current, opts);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sealed-qr.png";
      a.click();
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await toBlob(cardRef.current, opts);
      if (!blob) return;
      const file = new File([blob], "sealed-qr.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Sealed",
            text: "Scan to open a one-time secret",
          });
          setShared(true);
          setTimeout(() => setShared(false), 1800);
        } catch {
          // user cancelled — ignore
        }
      } else {
        await download();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-3xl shadow-lg">
        <div
          ref={cardRef}
          className="flex w-64 flex-col items-center gap-4 rounded-3xl bg-white px-6 py-6"
        >
          <div className="flex items-center gap-2">
            <CardMark />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
              Sealed
            </span>
          </div>

          <QRCodeSVG
            value={value}
            size={184}
            level="M"
            marginSize={0}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
            title="Scan to open the secret"
          />

          <div className="text-center">
            <p className="text-sm font-medium text-neutral-800">
              Scan to reveal a one-time secret
            </p>
            <p className="mt-1 font-mono text-xs text-neutral-400">getsealed.vercel.app</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="press gap-1.5"
          onClick={download}
          disabled={busy}
        >
          <Download className="size-4" />
          Download
        </Button>
        {canShare && (
          <Button
            variant="outline"
            size="sm"
            className="press gap-1.5"
            onClick={share}
            disabled={busy}
          >
            {shared ? (
              <Check key="check" className="pop size-4 text-emerald-400" />
            ) : (
              <Share2 className="size-4" />
            )}
            Share
          </Button>
        )}
      </div>
    </div>
  );
}
