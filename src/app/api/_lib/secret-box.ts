import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ausente ou curto demais para cifrar PII.");
  }
  cachedKey = scryptSync(secret, "wizold:pii:v1", 32);
  return cachedKey;
}

export function sealPII(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), body.toString("base64url")].join(":");
}

export function openPII(packed: string): string {
  const [iv, tag, body] = packed.split(":");
  if (!iv || !tag || !body) return packed;
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString(
    "utf8",
  );
}
