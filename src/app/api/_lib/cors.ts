const PRODUCTION_ORIGIN = "https://wizold.lumni.dev.br";

const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

function parseOrigin(value: string): string | null {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

export function allowedOrigins(): string[] {
  const fromEnv =
    process.env.ALLOWED_ORIGINS?.split(",")
      .map((entry) => parseOrigin(entry))
      .filter((entry): entry is string => entry !== null) ?? [];
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteOrigin = site ? parseOrigin(site) : null;
  const base = siteOrigin ? [siteOrigin] : [PRODUCTION_ORIGIN];
  if (process.env.NODE_ENV === "development") {
    return [...new Set([...base, ...DEV_ORIGINS, ...fromEnv])];
  }
  return [...new Set([...base, ...fromEnv])];
}

export function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const requestHost = new URL(request.url).host;
    if (originUrl.host === requestHost) return true;
    return allowedOrigins().includes(originUrl.origin);
  } catch {
    return false;
  }
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  if (!origin || !originAllowed(request)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-game-version",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
