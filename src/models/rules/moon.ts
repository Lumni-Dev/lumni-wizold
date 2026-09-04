import { FURY_WILLPOWER_MAX_BONUS, FURY_WILLPOWER_SCALE } from "@/shared/constants/game";

export type MoonPhaseKey = "new" | "waxing" | "full" | "waning";

export interface MoonPhase {
  key: MoonPhaseKey;
  label: string;

  experienceBonus: number;
  description: string;
}

export interface MoonState {
  phase: MoonPhase;

  age: number;

  illumination: number;

  waxing: boolean;
  source: "api" | "local";
}

export const SYNODIC_MONTH_DAYS = 29.530588853;

const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const DAY_MS = 86_400_000;

export const MOON_PHASES: readonly MoonPhase[] = [
  {
    key: "new",
    label: "Lua Nova",
    experienceBonus: 0,
    description: "Céu fechado. A fera dorme e a caça rende o de sempre.",
  },
  {
    key: "waxing",
    label: "Lua Crescente",
    experienceBonus: 0.05,
    description: "A lua engorda e o sangue começa a responder: é a fase que ensina mais rápido.",
  },
  {
    key: "full",
    label: "Lua Cheia",
    experienceBonus: 0,
    description:
      "A noite da matilha: a lua cheia mantém o Modo Fúria ativo enquanto durar a fase.",
  },
  {
    key: "waning",
    label: "Lua Minguante",
    experienceBonus: 0,
    description: "A lua se apaga e o corpo volta ao ritmo de antes.",
  },
];

export function findMoonPhase(key: MoonPhaseKey): MoonPhase {
  return MOON_PHASES.find((phase) => phase.key === key) ?? MOON_PHASES[0];
}

function moonAgeAt(now: number): number {
  const age = ((now - KNOWN_NEW_MOON) / DAY_MS) % SYNODIC_MONTH_DAYS;
  return age < 0 ? age + SYNODIC_MONTH_DAYS : age;
}

export function illuminationFromAge(age: number): number {
  return (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH_DAYS)) / 2;
}

export function phaseFromAge(age: number): MoonPhase {
  const halfWindow = SYNODIC_MONTH_DAYS / 16;
  const fullMoon = SYNODIC_MONTH_DAYS / 2;

  if (age < halfWindow || age >= SYNODIC_MONTH_DAYS - halfWindow) return findMoonPhase("new");
  if (age < fullMoon - halfWindow) return findMoonPhase("waxing");
  if (age < fullMoon + halfWindow) return findMoonPhase("full");
  return findMoonPhase("waning");
}

export function isWaxing(age: number): boolean {
  return age < SYNODIC_MONTH_DAYS / 2;
}

export function computeMoonLocally(now = Date.now()): MoonState {
  const age = moonAgeAt(now);
  return {
    phase: phaseFromAge(age),
    age,
    illumination: illuminationFromAge(age),
    waxing: isWaxing(age),
    source: "local",
  };
}

let currentState: MoonState | null = null;

export function applyMoonState(state: MoonState): void {
  currentState = state;
}

function currentMoon(now = Date.now()): MoonState {
  return currentState ?? computeMoonLocally(now);
}

export interface FuryCarrier {
  furyUntil?: string;
}

export function moonPhaseKey(moonPhase?: MoonPhaseKey, now = Date.now()): MoonPhaseKey {
  return moonPhase ?? currentMoon(now).phase.key;
}

export function isFullMoon(moonPhase?: MoonPhaseKey, now = Date.now()): boolean {
  return moonPhaseKey(moonPhase, now) === "full";
}

export function fullMoonRemainingMs(now = Date.now()): number {
  const state = currentMoon(now);
  if (state.phase.key !== "full") return 0;

  const halfWindow = SYNODIC_MONTH_DAYS / 16;
  const fullMoon = SYNODIC_MONTH_DAYS / 2;
  const startAge = fullMoon - halfWindow;
  const endAge = fullMoon + halfWindow;

  if (state.age >= startAge && state.age < endAge) {
    return Math.max(0, (endAge - state.age) * DAY_MS);
  }

  return halfWindow * 2 * DAY_MS;
}

export function furyWillpowerBonus(willpower: number): number {
  const value = Math.max(0, willpower);
  return (FURY_WILLPOWER_MAX_BONUS * value) / (value + FURY_WILLPOWER_SCALE);
}

export function furyDurationMs(minutes: number, willpower: number): number {
  const baseMs = minutes * 60_000;
  return Math.floor(baseMs + baseMs * furyWillpowerBonus(willpower));
}

export function furyDurationMinutes(minutes: number, willpower: number): number {
  return Math.round(furyDurationMs(minutes, willpower) / 6_000) / 10;
}

export function furyWillpowerExtraMs(minutes: number, willpower: number): number {
  return Math.max(0, furyDurationMs(minutes, willpower) - minutes * 60_000);
}

export function potionFuryRemainingMs(character: FuryCarrier, now = Date.now()): number {
  return character.furyUntil ? Math.max(0, Date.parse(character.furyUntil) - now) : 0;
}

export function furyRemainingMs(
  character: FuryCarrier,
  moonPhase?: MoonPhaseKey,
  now = Date.now(),
): number {
  const potion = potionFuryRemainingMs(character, now);
  const sky = isFullMoon(moonPhase, now) ? fullMoonRemainingMs(now) : 0;
  return Math.max(potion, sky);
}

export function isFuryActive(
  character: FuryCarrier,
  moonPhase?: MoonPhaseKey,
  now = Date.now(),
): boolean {
  return furyRemainingMs(character, moonPhase, now) > 0;
}

export function withMoonBonus(experience: number, moonPhase?: MoonPhaseKey, now = Date.now()): number {
  const bonus = moonPhase
    ? findMoonPhase(moonPhase).experienceBonus
    : currentMoon(now).phase.experienceBonus;
  return Math.round(experience * (1 + bonus));
}
