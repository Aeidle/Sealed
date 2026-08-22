"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * A pill-style segmented control. The segments are equal width (each `flex-1`),
 * so the highlight's width is constant and only its X position changes — it
 * animates with a single `translateX` (GPU, no layout), sliding one slot per
 * index. No DOM measurement needed.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );

  return (
    <div
      role="tablist"
      className={cn(
        "relative flex w-full rounded-xl border border-hairline bg-sunken p-1",
        className,
      )}
    >
      <span
        aria-hidden
        className="segment-indicator pointer-events-none absolute top-1 bottom-1 left-1 rounded-lg bg-card shadow-sm ring-1 ring-hairline transition-transform duration-[250ms]"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {options.map((option) => {
        const Icon = option.icon;
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "press relative z-10 flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium sm:gap-2 sm:px-3",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {/* Icon is dropped on narrow screens so all four fit; labels alone are clear. */}
            {Icon && <Icon className="hidden size-4 shrink-0 sm:block" aria-hidden />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
