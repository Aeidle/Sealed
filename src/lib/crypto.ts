/**
 * Client-side AES-256-GCM encryption via the WebCrypto API.
 *
 * The plaintext is encrypted in the browser and only the resulting ciphertext
 * is ever sent to the server. The symmetric key and IV are packed into the URL
 * fragment (#), which browsers never transmit to the server, so the server can
 * never decrypt what it stores.
 *
 * Optional password protection adds a second, out-of-band factor. When enabled,
 * the AES key is `R XOR PBKDF2(password, salt)`, where `R` is random key
 * material carried in the fragment and `salt` is public. Decryption then needs
 * BOTH the fragment (which has R + salt) AND the password. The server, which
 * only ever holds ciphertext, can never brute-force it because it never sees R.
 */

const KEY_BYTES = 32; // AES-256
const IV_BYTES = 12; // 96-bit nonce, recommended for GCM
const SALT_BYTES = 16;
const PBKDF2_ITERATIONS = 600_000;

export type ProtectionMode = "passphrase" | "code";

export interface EncryptOptions {
  /** If set, decryption requires this password in addition to the link. */
  password?: string;
  /** Which reveal UI the recipient should get. Purely cosmetic; not the crypto. */
  mode?: ProtectionMode;
}

export interface EncryptedSecret {
  /** base64url ciphertext (auth tag appended by GCM). Safe for the server to store. */
  ciphertext: string;
  /** Fragment string to append after `#` in the share URL. Never sent to server. */
  fragment: string;
}

/** Thrown by `decryptSecret` when the fragment is password-protected but none was given. */
export class PasswordRequiredError extends Error {
  constructor() {
    super("This secret is password-protected");
    this.name = "PasswordRequiredError";
  }
}

/** base64url (no padding) encode a byte array. */
function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode a base64url (no padding) string back to bytes. */
function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(length)));
}

/** 256 bits derived from the password via PBKDF2-SHA256. */
async function derivePasswordBits(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
  const pwKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    pwKey,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(a.length));
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}

async function importAesKey(
  keyBytes: Uint8Array<ArrayBuffer>,
  usage: KeyUsage,
): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [usage]);
}

/**
 * Encrypt a UTF-8 string. Returns the ciphertext (for the server) and a fragment
 * string that carries the key material + IV (+ salt/mode marker when protected).
 */
export async function encryptSecret(
  plaintext: string,
  options: EncryptOptions = {},
): Promise<EncryptedSecret> {
  const rawKey = randomBytes(KEY_BYTES); // R
  const iv = randomBytes(IV_BYTES);

  let keyBytes: Uint8Array<ArrayBuffer> = rawKey;
  let fragment = `${toBase64Url(rawKey)}.${toBase64Url(iv)}`;

  if (options.password) {
    const salt = randomBytes(SALT_BYTES);
    const pwBits = await derivePasswordBits(options.password, salt);
    keyBytes = xorBytes(rawKey, pwBits);
    const modeMark = options.mode === "code" ? "c" : "p";
    fragment = `${toBase64Url(rawKey)}.${toBase64Url(iv)}.${toBase64Url(salt)}.${modeMark}`;
  }

  const key = await importAesKey(keyBytes, "encrypt");
  const buffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  return { ciphertext: toBase64Url(new Uint8Array(buffer)), fragment };
}

export interface FragmentInfo {
  protected: boolean;
  mode?: ProtectionMode;
}

/** Inspect a fragment (client-side) to decide whether to prompt for a password. */
export function fragmentInfo(fragment: string): FragmentInfo {
  const parts = fragment.split(".");
  if (parts.length >= 4 && parts[2] && parts[3]) {
    return { protected: true, mode: parts[3] === "c" ? "code" : "passphrase" };
  }
  return { protected: false };
}

/**
 * Decrypt ciphertext using the key + IV recovered from the URL fragment. For a
 * protected secret, `password` is required and combined with the fragment key.
 * Throws `PasswordRequiredError` when protected and no password is supplied, and
 * throws on a wrong password (GCM authentication fails).
 */
export async function decryptSecret(
  ciphertext: string,
  fragment: string,
  password?: string,
): Promise<string> {
  const parts = fragment.split(".");
  const rawKeyPart = parts[0];
  const ivPart = parts[1];
  if (!rawKeyPart || !ivPart) {
    throw new Error("Invalid decryption fragment");
  }

  const rawKey = fromBase64Url(rawKeyPart);
  const iv = fromBase64Url(ivPart);
  if (rawKey.length !== KEY_BYTES || iv.length !== IV_BYTES) {
    throw new Error("Invalid key or IV length");
  }

  const isProtected = parts.length >= 4 && !!parts[2] && !!parts[3];
  let keyBytes: Uint8Array<ArrayBuffer> = rawKey;

  if (isProtected) {
    if (!password) throw new PasswordRequiredError();
    const salt = fromBase64Url(parts[2]);
    const pwBits = await derivePasswordBits(password, salt);
    keyBytes = xorBytes(rawKey, pwBits);
  }

  const key = await importAesKey(keyBytes, "decrypt");
  const buffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    fromBase64Url(ciphertext),
  );

  return new TextDecoder().decode(buffer);
}
