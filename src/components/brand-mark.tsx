import { cn } from "@/lib/utils";

/**
 * Sealed brand mark: a horizontally-split "S" monogram. The negative-space gap
 * + offset lower half reads as redaction / an encrypted split — on theme for a
 * one-time-secret tool. Theme-aware (foreground on the app's surface tokens);
 * the same glyph is mirrored in `app/icon.svg` for the favicon.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-lg bg-overlay ring-1 ring-hairline",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="26 24 54 52" className="size-[64%] text-foreground" fill="currentColor">
        {/* Top block of the S */}
        <path d="M 68 30 H 42 C 34 30 30 36 30 42 V 46 H 54 C 58 46 60 44 60 40 H 42 V 36 H 68 V 30 Z" />
        {/* Bottom block, shifted for the split/glitch effect */}
        <path d="M 38 70 H 64 C 72 70 76 64 76 58 V 54 H 52 C 48 54 46 56 46 60 H 64 V 64 H 38 V 70 Z" />
      </svg>
    </span>
  );
}
