# Important — read before changing crypto, storage, or the API

These are the invariants that keep Sealed's zero-knowledge, one-time guarantees
true. Breaking any of them silently weakens the security model.

## 1. The server must never see the key, IV, or plaintext

- Encryption/decryption happen **only** in the browser (`src/lib/crypto.ts`).
- The key + IV travel in the URL **fragment** (`#...`). Fragments are not sent
  in HTTP requests, so they never reach the server or server logs.
- The API handles only the opaque `ciphertext` string and the `id`. Do not add
  logging that captures request bodies verbatim, and never accept the key as a
  query param, header, or JSON field.

## 2. One-time read must be atomic

- `GET /api/secret/[id]` uses Redis **`GETDEL`** (`src/app/api/secret/[id]/route.ts`).
  Read-then-delete as two calls introduces a race where two concurrent readers
  both receive the ciphertext. Keep it a single atomic op.
- A consumed or expired secret returns **404**. Do not "helpfully" cache or
  retry the ciphertext anywhere.

## 3. TTL is the only expiry

- Expiry is enforced by the Redis TTL set at write time (`EXPIRY_OPTIONS` in
  `src/lib/redis.ts`: 5m / 1h / 1d / 7d). There is no cron/sweeper. If you add
  new expiry choices, add them to `EXPIRY_OPTIONS` **and** the UI buttons in
  `create-secret.tsx`; `isExpiryOption()` validates the server side.

## 4. AES-256-GCM specifics

- Key = 32 bytes, IV = 12 bytes. GCM appends its auth tag to the ciphertext, so
  a tampered ciphertext fails `decrypt()` (verified: tampering throws).
- A fresh random key **and** IV are generated per secret. Never reuse an IV with
  the same key.
- `fragment` format is `base64url(R).base64url(iv)` unprotected, or
  `base64url(R).base64url(iv).base64url(salt).<p|c>` when password-protected. If
  you change this format, update `encryptSecret`, `decryptSecret`, **and**
  `fragmentInfo`.

## 4b. Optional password protection

- When a password is set, the AES key is **`R XOR PBKDF2(password, salt)`**, where
  `R` is random key material in the fragment and `salt` is public. Decryption
  needs BOTH the fragment (R + salt) **and** the password.
- **Never** derive the key from the password alone, and **never** store any
  password-derived material (a wrapped key, a hash) server-side. Either would let
  the server brute-force the password offline and break zero-knowledge. Keeping
  `R` out of the server (it lives only in the fragment) is what prevents that.
- The password is **never** in the link and **never** in Redis. We store nothing
  about it, so a lost password means the secret is unrecoverable — by design.
- `passphrase` vs `code` is a UI marker only (`p`/`c` in the fragment); same
  crypto. The 6-digit code is low-entropy (~20 bits) and only a casual gate — the
  create UI must keep labelling it as weaker than a passphrase.
- Reveal must fetch the ciphertext **once** and retry the password **locally**
  (`cipherRef` in `reveal-secret.tsx`) so a wrong password doesn't re-burn the
  one-time read.

## 5. Rate limiting

- Both endpoints are rate limited by client IP (`src/lib/ratelimit.ts`): create
  = 10/60s, read = 30/60s. The IP comes from `x-forwarded-for` / `x-real-ip`;
  behind a proxy make sure those headers are trustworthy, or the limit is weak.
- The limiters use `fixedWindow` (one `INCR` per check) + a per-instance
  `ephemeralCache`, chosen to keep Redis command usage low (each limit check
  hits Redis, so it roughly doubles command count — the free Upstash tier is
  500k commands/month). Don't switch back to `slidingWindow` without a reason;
  it costs more commands per request for little benefit here.

## 6. Env / lazy init

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are required at
  runtime. The Redis client and limiters are **lazy singletons** so imports/builds
  don't touch env. Keep them lazy — eager `Redis.fromEnv()` at module scope logs
  warnings during build and couples the module graph to env.

## 7. Payload size

- `POST /api/secret` rejects ciphertext over ~1MB (`MAX_CIPHERTEXT_LENGTH`).
  Adjust with Upstash request-size limits in mind.

## 8. Privacy copy must stay true

- `privacy-note.tsx` and `how-it-works.tsx` state the security model as fact
  (client-side encryption, ciphertext-only storage, key in the fragment, delete
  on read, expiry). If the crypto/storage model ever changes, update that copy
  in the same PR, or it becomes a false claim.

## Caveats

- The original `secret-share-mockup.jsx` referenced in the task was **not present
  in the repo**; the UI was built from the written design brief and then iterated.
- End-to-end has been verified against live Upstash Redis (see `handoff.md`).
