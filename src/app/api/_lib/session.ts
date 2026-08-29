import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
export const SESSION_COOKIE = "wizold_session";
const SESSION_DAYS = 30;
function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET ausente ou curto demais no .env.local.");
  }
  return value;
}
function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}
export interface SessionClaims {
  userId: string;
  epoch: number;
}
export function mintSession(
  userId: string,
  epoch: number,
): {
  value: string;
  maxAge: number;
} {
  const expiry = Date.now() + SESSION_DAYS * 86400000;
  const payload = userId + "." + epoch + "." + expiry;
  return { value: payload + "." + sign(payload), maxAge: SESSION_DAYS * 86400 };
}
export function verifySession(token: string | undefined): SessionClaims | null {
  if (!token) return null;
  const at = token.lastIndexOf(".");
  if (at <= 0) return null;
  const payload = token.slice(0, at);
  const given = token.slice(at + 1);
  const wanted = sign(payload);
  const a = Buffer.from(given);
  const b = Buffer.from(wanted);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const parts = payload.split(".");
  // Old tokens are userId.expiry (epoch defaults to 0, matching the column
  // default); new tokens are userId.epoch.expiry.
  const userId = parts[0];
  const epoch = parts.length >= 3 ? Number(parts[1]) : 0;
  const expiry = parts.length >= 3 ? Number(parts[2]) : Number(parts[1]);
  if (!userId || !Number.isFinite(epoch) || !Number.isFinite(expiry) || expiry < Date.now()) {
    return null;
  }
  return { userId, epoch };
}
export async function sessionClaims(): Promise<SessionClaims | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}
export async function sessionUserId(): Promise<string | null> {
  return (await sessionClaims())?.userId ?? null;
}
export async function attachSession(userId: string, epoch: number): Promise<void> {
  const jar = await cookies();
  const minted = mintSession(userId, epoch);
  jar.set(SESSION_COOKIE, minted.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: minted.maxAge,
  });
}
export async function dropSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
export function deletionCodeHash(userId: string, code: string): string {
  return createHmac("sha256", secret()).update(userId + ":" + code).digest("hex");
}
export function hashSecret(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(plain, salt, 32).toString("hex");
}
export function verifySecret(plain: string, packed: string): boolean {
  const [salt, stored] = packed.split(":");
  if (!salt || !stored) return false;
  const computed = scryptSync(plain, salt, 32);
  const wanted = Buffer.from(stored, "hex");
  return computed.length === wanted.length && timingSafeEqual(computed, wanted);
}
