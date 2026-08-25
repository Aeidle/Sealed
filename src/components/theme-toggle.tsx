"use client";

import { useTheme } from "next-themes";

/**
 * Single-button light/dark toggle (no dropdown), matching the reference: the
 * button takes the theme colour (white in light, dark in dark, defined by a
 * hairline ring), with a bold sun that cross-fades and spins into a bold
 * crescent moon. Pure CSS off the `.dark` class (transform + opacity only — no
 * animation library, no hydration flash). Default theme is `system`.
 */
export function ThemeToggle() {
  const { setTheme } = useTheme();

  function toggle() {
    const isDark =
      typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="press relative grid size-9 place-items-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-hairline"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        {/* Sun — shown in light */}
        <g
          fill="currentColor"
          className="origin-center [transform-box:fill-box] rotate-0 scale-100 opacity-100 transition-[transform,opacity] duration-300 [transition-timing-function:var(--ease-out)] dark:-rotate-90 dark:scale-0 dark:opacity-0"
        >
          <circle cx="12" cy="12" r="4.6" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1.6v2.4" />
            <path d="M12 20v2.4" />
            <path d="M22.4 12H20" />
            <path d="M4 12H1.6" />
            <path d="m19.4 4.6-1.7 1.7" />
            <path d="m6.3 17.7-1.7 1.7" />
            <path d="m19.4 19.4-1.7-1.7" />
            <path d="m6.3 6.3-1.7-1.7" />
          </g>
        </g>

        {/* Moon — shown in dark (bold crescent carved from a disc) */}
        <g
          className="origin-center [transform-box:fill-box] rotate-90 scale-0 opacity-0 transition-[transform,opacity] duration-300 [transition-timing-function:var(--ease-out)] dark:rotate-0 dark:scale-100 dark:opacity-100"
        >
          <mask id="theme-toggle-moon">
            <rect x="0" y="0" width="24" height="24" fill="white" />
            <circle cx="18" cy="9" r="8" fill="black" />
          </mask>
          <circle cx="12" cy="12" r="8" fill="currentColor" mask="url(#theme-toggle-moon)" />
        </g>
      </svg>
    </button>
  );
}
