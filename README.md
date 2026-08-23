<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.svg">
  <img src="public/logo-light.svg" alt="Sealed" width="76" height="76">
</picture>

# Sealed

**Share a secret, once.** A link that self-destructs after a single read, encrypted in your browser, never on the server.

[![Stars](https://img.shields.io/github/stars/Aeidle/Sealed?style=flat&logo=github&label=Stars&color=1f6feb)](https://github.com/Aeidle/Sealed/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

Sealed is a one-time secret sharer. You encrypt a secret in your browser, get a
link, and the link works **exactly once**: opening it fetches the ciphertext, the
server deletes it in the same step, and your browser decrypts it locally. The
server never sees your plaintext or your key.

## Why it's private

- **Client-side AES-256-GCM.** Encryption and decryption run entirely in the
  browser via the Web Crypto API. The plaintext never leaves the page.
- **The key never reaches the server.** The decryption key + IV live in the URL
  `#` fragment, which browsers never send in a request.
- **Ciphertext-only storage.** The server stores an opaque encrypted blob it
  can't read, keyed by a random [nanoid](https://github.com/ai/nanoid).
- **One-time read.** Reads use an atomic Redis `GETDEL` — the secret is returned
  and deleted in a single operation, so a second open gets a 404.
- **Self-destructing.** Every secret carries a TTL (5m / 1h / 1d / 7d) and
  expires on its own if never read.
- **Optional password.** Add a passphrase or a 6-digit code as a second,
  out-of-band factor. The key becomes `R XOR PBKDF2(password)` — a leaked link
  alone can't decrypt, and the server still never can. The password is never
  stored or put in the link.

## Features

- Text, Link, Login, and Card secret types
- Optional password protection (passphrase or 6-digit code)
- Revealed values masked by default, with a per-field reveal toggle
- Rate limiting on both endpoints
- Light / dark / system themes
- Fully keyboard- and reduced-motion-accessible UI

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui · Upstash Redis · Web Crypto API · pnpm

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in your Upstash Redis credentials
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Create an [Upstash Redis](https://console.upstash.com/) database and set:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Scripts

```bash
pnpm dev     # development server
pnpm build   # production build (also typechecks)
pnpm start   # run the production build
pnpm lint    # eslint
```

## Contributing

Issues and pull requests are welcome. The encryption and storage model is small
and readable by design, `src/lib/crypto.ts` and the two API routes under
`src/app/api/secret/` are the whole story, so it's easy to audit.

## License

[MIT](./LICENSE) © Aeidle
