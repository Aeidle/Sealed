# Handoff

Status as of 2026-08-22.

## What Sealed is

A one-time secret sharer on Next.js 16 + React 19 + Tailwind v4 +
shadcn/ui (Base UI primitives), pnpm, Upstash Redis, and the Web Crypto API.

- Client-side **AES-256-GCM** encryption. The server only ever stores ciphertext;
  the key + IV live in the URL `#` fragment and never reach the server.
- `POST /api/secret` — stores ciphertext in Redis with a TTL for the chosen
  expiry (5m / 1h / 1d / 7d), returns a nanoid `id`.
- `GET /api/secret/[id]` — atomic `GETDEL`, one-time read, deletes on read.
- Rate limiting on both endpoints (create 10/min, read 30/min per IP), tuned for
  low Redis command usage (`fixedWindow` + `ephemeralCache`).
- Secret types: Text / Link / Login / Card.

## UI / design

- **Light / dark / system** theme via `next-themes` (toggle in `SiteHeader`).
  Surfaces are theme-aware tokens (`bg-sunken`, `border-hairline`, `bg-overlay`,
  glass), never hardcoded white/black alphas.
- **Two-column hero** on desktop (`max-w-6xl`): create card on the left, "How it
  works" + privacy rail on the right; collapses to a single column on mobile.
  The reveal page stays centered.
- **Brand mark**: a split "S" monogram (`brand-mark.tsx`) that also drives the
  favicon (`app/icon.svg`, mirrored to `public/icon.svg`).
- **Ambient background**: a single slow-drifting purple glow (`.app-backdrop`),
  pure-CSS `transform` only, reduced-motion aware.
- Motion is CSS + rAF only (no animation library). Full reduced-motion /
  reduced-transparency / contrast support. See the "Motion & materials" section
  in `CLAUDE.md`.
- **Open source**: GitHub link in the header + "Star on GitHub" CTA, MIT
  `LICENSE`, README with badges.

## Verified

- ✅ `npx tsc --noEmit`, `pnpm build`, `pnpm lint` — all clean.
- ✅ Crypto round-trip via the real `src/lib/crypto.ts` (ASCII/unicode/multiline;
  tampered ciphertext rejected by GCM auth).
- ✅ **End-to-end against live Upstash Redis (Frankfurt)**: encrypt → POST (201)
  → GET (200) → decrypt matches; second GET → **404** (one-time read); unknown
  id → 404; missing ciphertext / invalid expiry → 400; create limiter → 429
  after the window is spent.

## To run

1. Create an Upstash Redis database (https://console.upstash.com/), free tier.
2. `cp .env.example .env.local` and fill in `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`.
3. `pnpm dev`, open http://localhost:3000.

`.env.local` is gitignored; `.env.example` is committed as the template.

## Decisions worth knowing

- `create-next-app` scaffolded into a temp `sealed/` folder (npm rejects the
  capitalized dir name "Sealed"); contents were moved to the root. Package name
  is `sealed`.
- shadcn init left `--font-sans` self-referential (fell back to system sans);
  it's now wired to Geist. Don't regress that.
- Redis client + rate limiters are lazy singletons (see `important.md` §6).

## Not done (optional future work)

- No deployment config (Vercel etc.) yet. Set the two env vars in the host.
- No automated test suite in-repo (verification was done via ad-hoc scripts).
- Possible extras: a "burn now" manual-delete button, a copy-link QR code, a
  max-views > 1 option.
