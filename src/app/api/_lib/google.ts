import { createPublicKey, verify } from "node:crypto";

const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const JWKS_TTL_MS = 3600000;
const REFETCH_FLOOR_MS = 30000;
const CLOCK_SKEW_MS = 60000;

interface GoogleKey {
  kid?: string;
  kty?: string;
  n?: string;
  e?: string;
}

let cachedKeys: GoogleKey[] = [];
let fetchedAt = 0;

async function keyOf(kid: string): Promise<GoogleKey | null> {
  const stale = Date.now() - fetchedAt > JWKS_TTL_MS;
  const missing = !cachedKeys.some((key) => key.kid === kid);
  if ((stale || missing) && Date.now() - fetchedAt > REFETCH_FLOOR_MS) {
    try {
      const answer = await fetch(JWKS_URL, { cache: "no-store" });
      if (answer.ok) {
        const body = (await answer.json()) as { keys?: GoogleKey[] };
        if (Array.isArray(body.keys)) {
          cachedKeys = body.keys;
          fetchedAt = Date.now();
        }
      }
    } catch {}
  }
  return cachedKeys.find((key) => key.kid === kid) ?? null;
}

function decodePart(part: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function verifyGoogleCredential(credential: string): Promise<{
  email: string;
  picture: string | null;
} | null> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const parts = credential.split(".");
  if (parts.length !== 3) return null;
  const header = decodePart(parts[0]);
  const claims = decodePart(parts[1]);
  if (!header || !claims) return null;
  if (header.alg !== "RS256" || typeof header.kid !== "string") return null;
  const jwk = await keyOf(header.kid);
  if (!jwk || jwk.kty !== "RSA" || !jwk.n || !jwk.e) return null;
  let sound = false;
  try {
    const key = createPublicKey({ key: { kty: jwk.kty, n: jwk.n, e: jwk.e }, format: "jwk" });
    sound = verify(
      "RSA-SHA256",
      Buffer.from(parts[0] + "." + parts[1]),
      key,
      Buffer.from(parts[2], "base64url"),
    );
  } catch {
    return null;
  }
  if (!sound) return null;
  if (claims.aud !== clientId) return null;
  if (typeof claims.iss !== "string" || !ISSUERS.includes(claims.iss)) return null;
  const expiry = Number(claims.exp);
  if (!Number.isFinite(expiry) || expiry * 1000 < Date.now() - CLOCK_SKEW_MS) return null;
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  const verified = claims.email_verified === true || claims.email_verified === "true";
  if (!email || !verified) return null;
  const picture =
    typeof claims.picture === "string" &&
    claims.picture.startsWith("https://") &&
    claims.picture.length <= 1024
      ? claims.picture
      : null;
  return { email, picture };
}
