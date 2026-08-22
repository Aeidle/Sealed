import { customAlphabet } from "nanoid";

/**
 * URL-safe secret IDs. 21 chars from an unambiguous alphabet gives ~124 bits
 * of entropy, so IDs are effectively unguessable and safe to expose in a URL.
 */
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const newSecretId = customAlphabet(alphabet, 21);
