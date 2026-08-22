import { FileText, Link as LinkIcon, KeyRound, CreditCard, type LucideIcon } from "lucide-react";

/** The four kinds of secret the app can package. */
export type SecretType = "text" | "link" | "login" | "card";

export interface SecretTypeMeta {
  id: SecretType;
  label: string;
  icon: LucideIcon;
}

export const SECRET_TYPES: SecretTypeMeta[] = [
  { id: "text", label: "Text", icon: FileText },
  { id: "link", label: "Link", icon: LinkIcon },
  { id: "login", label: "Login", icon: KeyRound },
  { id: "card", label: "Card", icon: CreditCard },
];

/** Structured payloads per type, serialized to JSON before encryption. */
export interface TextPayload {
  type: "text";
  text: string;
}
export interface LinkPayload {
  type: "link";
  url: string;
}
export interface LoginPayload {
  type: "login";
  username: string;
  password: string;
  url?: string;
}
export interface CardPayload {
  type: "card";
  number: string;
  expiry: string;
  cvc: string;
  name?: string;
}

export type SecretPayload = TextPayload | LinkPayload | LoginPayload | CardPayload;

/** Serialize a payload to the plaintext string that gets encrypted. */
export function serializePayload(payload: SecretPayload): string {
  return JSON.stringify(payload);
}

/** Parse decrypted plaintext back into a structured payload. */
export function parsePayload(plaintext: string): SecretPayload {
  const parsed = JSON.parse(plaintext) as SecretPayload;
  if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
    throw new Error("Malformed secret payload");
  }
  return parsed;
}
