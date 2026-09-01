import {
  applyMoonState,
  computeMoonLocally,
  findMoonPhase,
  illuminationFromAge,
  isWaxing,
  phaseFromAge,
  SYNODIC_MONTH_DAYS,
  type MoonPhaseKey,
  type MoonState,
} from "@/models/rules/moon";

const MOON_API = "https://api.viewbits.com/v1/moonphase";
const CACHE_MS = 3_600_000;
const RETRY_MS = 600_000;

const PHASE_BY_NAME: Record<string, MoonPhaseKey> = {
  "new moon": "new",
  "waxing crescent": "waxing",
  "first quarter": "waxing",
  "waxing gibbous": "waxing",
  "full moon": "full",
  "waning gibbous": "waning",
  "last quarter": "waning",
  "third quarter": "waning",
  "waning crescent": "waning",
};

interface MoonApiEntry {
  date?: string;
  illumination?: string;
  moon_age?: string;
  phase?: string;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

let cached: MoonState | null = null;
let cachedAt = 0;

export async function serverMoon(): Promise<MoonState> {
  const ttl = cached?.source === "api" ? CACHE_MS : RETRY_MS;
  if (cached && Date.now() - cachedAt < ttl) return cached;

  try {
    const response = await fetch(MOON_API, { cache: "no-store" });
    if (!response.ok) throw new Error("resposta " + response.status);
    const days: unknown = await response.json();
    if (!Array.isArray(days) || days.length === 0) throw new Error("formato inesperado");
    const entries = days as MoonApiEntry[];
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const entry = entries.find((day) => day.date === today);
    if (!entry) throw new Error("dia atual ausente na resposta");
    const age = parseNumber(entry.moon_age);
    if (age === null) throw new Error("idade da lua ausente");
    const wrapped = ((age % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
    const named = entry.phase ? PHASE_BY_NAME[entry.phase.trim().toLowerCase()] : undefined;
    const illumination = parseNumber(entry.illumination);
    cached = {
      phase: named ? findMoonPhase(named) : phaseFromAge(wrapped),
      age: wrapped,
      illumination:
        illumination === null
          ? illuminationFromAge(wrapped)
          : Math.min(1, Math.max(0, illumination / 100)),
      waxing: isWaxing(wrapped),
      source: "api",
    };
  } catch {
    cached = computeMoonLocally();
  }
  cachedAt = Date.now();
  return cached;
}

export async function syncServerMoon(): Promise<void> {
  applyMoonState(await serverMoon());
}
