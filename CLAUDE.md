@AGENTS.md

# Sealed

One-time secret sharing. A sender encrypts a secret in the browser, gets a link,
and the link works exactly once: opening it fetches the ciphertext, the server
deletes it, and the browser decrypts it locally. The server never sees the
plaintext or the key.

## Stack

- Next.js 16 (App Router, `src/` dir, TypeScript), React 19
- Tailwind CSS v4 + shadcn/ui (base color: **neutral**, style: base-nova; primitives
  are **Base UI**, so triggers use `render={<.../>}`, not Radix's `asChild`)
- `next-themes` for light/dark/system (see Theming below)
- pnpm
- Upstash Redis (REST) for ciphertext storage + rate limiting
- WebCrypto (AES-256-GCM), nanoid for IDs

## Theming, type & layout

- **Light + dark + system** via `next-themes` (`ThemeProvider` in `layout.tsx`,
  `attribute="class"`, `defaultTheme="dark"`). Toggle: `theme-toggle.tsx` in the
  `SiteHeader`.
- **Never hardcode `white/N` or `black/N` alphas** — they don't flip with theme.
  Use the theme-aware surface tokens defined in `globals.css` (`:root` = light,
  `.dark` = dark) and exposed as Tailwind colors via `@theme inline`:
  `bg-sunken` (wells/inputs), `border-hairline` / `ring-hairline` (edges),
  `bg-overlay` / `bg-overlay-strong` (fills), plus shadcn's own `bg-card`,
  `bg-muted`, `text-muted-foreground`, etc. `.glass` and `.app-backdrop` have
  explicit light + `.dark` variants.
- **Font:** Geist Sans (UI) + Geist Mono (secrets/links). `--font-sans` is wired
  to `--font-geist-sans` in the `@theme` block — the shadcn init left it
  self-referential (falling back to system sans); don't regress that.
- **Page shell:** `SiteHeader` (split-`S` `BrandMark` wordmark + GitHub link +
  `ThemeToggle`). Home is a **two-column hero** (`max-w-6xl`): create card left,
  `HowItWorks` (stack variant) + `PrivacyNote` rail right; collapses to one
  column on mobile. Reveal page stays a centered `max-w-md` column with
  `PrivacyNote`. `PrivacyNote` / `HowItWorks` copy is factually tied to the
  implementation — keep it accurate if the crypto/storage model changes.
- **Background:** `.app-backdrop` is a flat base + one slow-drifting purple glow
  (`::after`), pure-CSS `transform`, reduced-motion aware. Gradients use
  `closest-side` sizing so they never hard-cut at the element edge.

## How it works (the important part)

1. **Encrypt (client).** `src/lib/crypto.ts` generates a random AES-256-GCM key
   + 12-byte IV, encrypts the plaintext, and returns `{ ciphertext, fragment }`.
   `fragment` is `base64url(key).base64url(iv)`.
2. **Store (server).** `POST /api/secret` writes the ciphertext to Redis under
   `secret:<id>` with a TTL matching the chosen expiry, returns the nanoid `id`.
3. **Share.** The client builds `/{origin}/s/<id>#<fragment>`. The key lives in
   the URL **fragment**, which browsers never send to the server.
4. **Reveal (once).** `GET /api/secret/[id]` does an atomic Redis `GETDEL` — it
   returns the ciphertext and deletes it in one operation, so a second read gets
   a 404. The client reads the key from `location.hash` and decrypts locally.

## Layout

```
src/
  app/
    page.tsx                 # create-secret page
    s/[id]/page.tsx          # reveal page
    api/secret/route.ts      # POST: store ciphertext + TTL
    api/secret/[id]/route.ts # GET: one-time read (GETDEL) + delete
    icon.svg                 # favicon (split-S), theme-adaptive
  components/
    create-secret.tsx        # form: segmented control, expiry, encrypt+POST
    reveal-secret.tsx        # countdown-ring reveal, decrypt, render by type
    segmented-control.tsx    # translateX-highlight Text/Link/Login/Card selector
    countdown-ring-button.tsx
    glass-card.tsx
    site-header.tsx          # wordmark + GitHub link + theme toggle
    theme-provider.tsx / theme-toggle.tsx   # next-themes
    brand-mark.tsx           # split-S monogram logo
    how-it-works.tsx / privacy-note.tsx     # trust/explanation copy
    icons/github.tsx         # inlined GitHub mark (lucide dropped brand icons)
    ui/                       # shadcn primitives (Base UI)
  hooks/
    use-prefers-reduced-motion.ts   # useSyncExternalStore matchMedia
  lib/
    crypto.ts                # AES-256-GCM encrypt/decrypt (browser only)
    redis.ts                 # lazy Upstash client, EXPIRY_OPTIONS, key helpers
    ratelimit.ts             # lazy fixed-window limiters + ephemeralCache (create + read)
    id.ts                    # nanoid secret IDs
    secret-types.ts          # Text/Link/Login/Card payload model
    site.ts                  # GITHUB_URL / repo constants
```

## Commands

```bash
pnpm dev          # dev server
pnpm build        # production build (also typechecks)
pnpm lint         # eslint
npx tsc --noEmit  # typecheck only
```

## Environment

Copy `.env.example` to `.env.local` and set:

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Without these the API routes return runtime errors on request (the build and
static pages still work — the Redis client is constructed lazily).

## Conventions

- Never send the key, IV, or plaintext to the server. It only ever handles the
  opaque `ciphertext` string and the `id`.
- The Redis client and rate limiters are lazy singletons (`getRedis()`,
  `getCreateLimiter()`, `getReadLimiter()`) so nothing touches env at import time.
- One-time-read must stay atomic — use `GETDEL`, never get-then-delete.
- See `important.md` for constraints that are easy to break, and `handoff.md`
  for current state and what's left.

## Motion & materials (Apple-fluid pass)

Motion follows *Designing Fluid Interfaces* + Emil Kowalski's build rules;
helpers live in `globals.css`. No animation library — CSS + `requestAnimationFrame`
only. Curves come from three tokens (`--ease-out`, `--ease-in-out`,
`--ease-drawer`); don't inline others. Every animated property is `transform` or
`opacity` (GPU, no layout/paint), and every UI animation is under 300ms.

- `.segment-indicator` — the segmented-control highlight. Segments are equal
  width, so the highlight slides with a single `translateX` (no `width`/`left`,
  no DOM measurement). `--ease-drawer`, 250ms.
- `.materialize` — content arriving with rise + scale + fade (transform+opacity
  only, no blur). Used when card content swaps. `--ease-out`, 400ms.
- `.enter` — page-mount rise+fade. `--ease-out`, 450ms. CSS animation (not a
  transition) so it runs off-main-thread during mount/load.
- `.press` — pointer-down feedback (scale 0.97, 120ms). On interactive controls.
- `.shake` — horizontal jitter signalling rejected input (empty field, 429).
  Re-triggered by remounting the error line via a `key`. `create-secret.tsx`.
- `.pop` — scale-in for confirmation icons (the "Copied" check).
- Countdown ring is driven frame-by-frame by rAF with no CSS transition, so it
  never lags actual progress. It's the deliberate (hold-style) phase; the reveal
  that follows is the snappy system response.
- `usePrefersReducedMotion()` (`src/hooks/`) uses `useSyncExternalStore` to reach
  JS-driven motion the CSS media query can't — the ring skips its sweep and
  reveals on click under reduced motion. Spinners fall back to an opacity pulse
  (`rm-pulse`), also in the reduced-motion block.
- Accessibility is baked in via `prefers-reduced-motion` (cross-fade, no
  travel), `prefers-reduced-transparency` (frost the glass solid), and
  `prefers-contrast: more` (near-solid + defined border). Preserve these when
  touching `globals.css`.
