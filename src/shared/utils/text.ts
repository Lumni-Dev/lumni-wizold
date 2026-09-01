export function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1);
}

export function sanitizeName(value: string, maximum: number): string {
  return capitalize(value.replace(/[^\p{L}\p{M}\p{N}]/gu, "").slice(0, maximum));
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Host suffixes allowed in tavern chat (subdomains included). */
const ALLOWED_LINK_SUFFIXES = [
  "lumni.dev.br",
  "wizold.com.br",
  "twitch.tv",
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "facebook.com",
  "fb.com",
  "fb.me",
  "whatsapp.com",
  "wa.me",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "t.co",
] as const;

const PROTOCOL_URL = /https?:\/\/[^\s]+/gi;
const WWW_URL = /\bwww\.[^\s]+/gi;
const BARE_DOMAIN =
  /\b(?:[a-z0-9][a-z0-9-]*\.)+(?:com\.br|com|net|org|br|io|gg|app|dev|xyz|me|co|tv|site|online|link)(?:\/[^\s]*)?/gi;

function hostOf(token: string): string {
  const trimmed = token.replace(/[),.!?;:]+$/g, "");
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).hostname.toLowerCase();
    } catch {
      return "";
    }
  }
  const withoutWww = trimmed.replace(/^www\./i, "");
  return withoutWww.split(/[\/?#]/)[0]?.toLowerCase() ?? "";
}

function isAllowedLinkHost(host: string): boolean {
  if (!host) return true;
  const normalized = host.replace(/^www\./, "");
  return ALLOWED_LINK_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith("." + suffix),
  );
}

function linkTokensOf(value: string): string[] {
  const tokens = new Set<string>();
  for (const pattern of [PROTOCOL_URL, WWW_URL, BARE_DOMAIN]) {
    pattern.lastIndex = 0;
    for (const match of value.matchAll(pattern)) {
      tokens.add(match[0]);
    }
  }
  return [...tokens];
}

/** True when the text carries a link outside the tavern allowlist. */
export function containsLink(value: string): boolean {
  return linkTokensOf(value).some((token) => !isAllowedLinkHost(hostOf(token)));
}

export function isAllowedChatLink(value: string): boolean {
  const host = hostOf(value.trim());
  return host !== "" && isAllowedLinkHost(host);
}
