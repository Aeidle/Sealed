"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface CountdownRingButtonProps {
  /** Called once the countdown ring completes. */
  onComplete: () => void;
  /** Countdown duration in milliseconds. */
  durationMs?: number;
  label?: string;
  armingLabel?: string;
  disabled?: boolean;
}

const SIZE = 132;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A circular reveal button. Clicking arms it: a ring sweeps around the edge
 * over `durationMs` (a deliberate pause that guards against accidental one-time
 * reveals), then fires `onComplete`. Clicking again while arming cancels it.
 */
export function CountdownRingButton({
  onComplete,
  durationMs = 1500,
  label = "Reveal",
  armingLabel = "Hold on…",
  disabled = false,
}: CountdownRingButtonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [arming, setArming] = useState(false);
  const [progress, setProgress] = useState(0); // 0 → 1
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!arming) return;

    function tick(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const next = Math.min(elapsed / durationMs, 1);
      setProgress(next);

      if (next >= 1) {
        setArming(false);
        onComplete();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [arming, durationMs, onComplete]);

  function handleClick() {
    if (disabled) return;
    // Reduced motion: no sweep. The click itself is the confirm; reveal at once.
    if (prefersReducedMotion) {
      onComplete();
      return;
    }
    if (arming) {
      setArming(false);
      setProgress(0);
    } else {
      setProgress(0);
      setArming(true);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "group relative grid place-items-center rounded-full outline-none disabled:opacity-40",
        "focus-visible:ring-2 focus-visible:ring-ring",
      )}
      style={{ width: SIZE, height: SIZE }}
      aria-label={label}
    >
      <svg
        width={SIZE}
        height={SIZE}
        className="absolute inset-0 -rotate-90"
        aria-hidden
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-foreground/10"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          /* Driven frame-by-frame by requestAnimationFrame — no CSS transition,
             so the ring never lags the actual progress or the finger. */
          className="text-foreground"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>

      <span
        className={cn(
          "grid size-[104px] place-items-center rounded-full border border-hairline bg-card text-center text-sm font-medium shadow-sm transition",
          "group-hover:bg-overlay group-active:scale-95",
        )}
      >
        {arming ? armingLabel : label}
      </span>
    </button>
  );
}
