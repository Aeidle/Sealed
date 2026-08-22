/**
 * Client-side AES-256-GCM encryption via the WebCrypto API.
 *
 * The plaintext is encrypted in the browser and only the resulting ciphertext
 * is ever sent to the server. The symmetric key and IV are packed into the URL
 * fragment (#), which browsers never transmit to the server, so the server can
 * never decrypt what it stores.
 */

const KEY_BYTES = 32; // AES-256
const IV_BYTES = 12; // 96-bit nonce, recommended for GCM

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

export interface EncryptedSecret {
  /** base64 ciphertext (auth tag appended by GCM). Safe for the server to store. */
  ciphertext: string;
  /** Fragment string to append after `#` in the share URL. Never sent to server. */
  fragment: string;
}

/**
 * Encrypt a UTF-8 string. Returns the ciphertext (for the server) and a
 * fragment string that carries the key + IV (for the URL hash).
 */
export async function encryptSecret(plaintext: string): Promise<EncryptedSecret> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);

  const buffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));

  const ciphertextBytes = new Uint8Array(buffer);

  return {
    ciphertext: toBase64Url(ciphertextBytes),
    // key.iv — both base64url, dot-separated, so it survives being a URL hash.
    fragment: `${toBase64Url(rawKey)}.${toBase64Url(iv)}`,
  };
}

/**
 * Decrypt ciphertext using the key + IV recovered from the URL fragment.
 * Throws if the fragment is malformed or the ciphertext fails authentication.
 */
export async function decryptSecret(ciphertext: string, fragment: string): Promise<string> {
  const [rawKeyPart, ivPart] = fragment.split(".");
  if (!rawKeyPart || !ivPart) {
    throw new Error("Invalid decryption fragment");
  }

  const rawKey = fromBase64Url(rawKeyPart);
  const iv = fromBase64Url(ivPart);

  if (rawKey.length !== KEY_BYTES || iv.length !== IV_BYTES) {
    throw new Error("Invalid key or IV length");
  }

  const key = await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, [
    "decrypt",
  ]);

  const buffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    fromBase64Url(ciphertext),
  );

  return new TextDecoder().decode(buffer);
}
