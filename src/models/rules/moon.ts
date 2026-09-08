import {
  FURY_WILLPOWER_EXTRA_MINUTES,
  FURY_WILLPOWER_MAX_BONUS,
  FURY_WILLPOWER_SCALE,
} from "@/shared/constants/game";

export type MoonPhaseKey = "new" | "waxing" | "full" | "waning";

export interface MoonPhase {
  key: MoonPhaseKey;
  label: string;

  experienceBonus: number;
  trainingBonus: number;
  miningBonus: number;
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
    label: "New Moon",
    experienceBonus: 0,
    trainingBonus: 0,
    miningBonus: 0.05,
    description: "Closed sky. The beast sleeps, and in the dark the rock pays more to whoever mines.",
  },
  {
    key: "waxing",
    label: "Waxing Moon",
    experienceBonus: 0.05,
    trainingBonus: 0.05,
    miningBonus: 0,
    description:
      "The moon fattens and the blood starts to answer: it is the phase that teaches fastest, on the hunt and in the yard.",
  },
  {
    key: "full",
    label: "Full Moon",
    experienceBonus: 0,
    trainingBonus: 0,
    miningBonus: 0,
    description:
      "The pack's night: the full moon keeps Fury Mode on while the phase lasts.",
  },
  {
    key: "waning",
    label: "Waning Moon",
    experienceBonus: 0,
    trainingBonus: 0,
    miningBonus: 0,
    description: "The moon fades and the body returns to its old pace, with no bonus at all.",
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

// The Willpower stretch is flat: the same extra time lands on every flask, no
// matter its size, so a bigger potion buys more base and never a bigger bonus.
// It caps at FURY_WILLPOWER_EXTRA_MINUTES, with half of that at the scale.
export function furyWillpowerExtraMs(willpower: number): number {
  const extraMs = FURY_WILLPOWER_EXTRA_MINUTES * 60_000 * furyWillpowerBonus(willpower);
  return Math.floor(extraMs / 1000) * 1000;
}

export function furyDurationMs(minutes: number, willpower: number): number {
  return minutes * 60_000 + furyWillpowerExtraMs(willpower);
}

export function furyDurationMinutes(minutes: number, willpower: number): number {
  return Math.round(furyDurationMs(minutes, willpower) / 6_000) / 10;
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

function phaseOf(moonPhase?: MoonPhaseKey, now = Date.now()): MoonPhase {
  return moonPhase ? findMoonPhase(moonPhase) : currentMoon(now).phase;
}

export function withMoonBonus(experience: number, moonPhase?: MoonPhaseKey, now = Date.now()): number {
  return Math.round(experience * (1 + phaseOf(moonPhase, now).experienceBonus));
}

export function withMoonTrainingBonus(
  progress: number,
  moonPhase?: MoonPhaseKey,
  now = Date.now(),
): number {
  return Math.round(progress * (1 + phaseOf(moonPhase, now).trainingBonus));
}

export function withMoonMiningBonus(
  effort: number,
  moonPhase?: MoonPhaseKey,
  now = Date.now(),
): number {
  return Math.round(effort * (1 + phaseOf(moonPhase, now).miningBonus));
}
