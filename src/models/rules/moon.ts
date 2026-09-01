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
      "A noite da matilha: o corpo responde como nunca, mas a cabeça não aprende mais rápido.",
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

export const FULL_MOON_ATTRIBUTE_BONUS = 5;

export function moonAttributeBonus(moonPhase?: MoonPhaseKey, now = Date.now()): number {
  const key = moonPhase ?? currentMoon(now).phase.key;
  return key === "full" ? FULL_MOON_ATTRIBUTE_BONUS : 0;
}

export function withMoonBonus(experience: number, moonPhase?: MoonPhaseKey, now = Date.now()): number {
  const bonus = moonPhase
    ? findMoonPhase(moonPhase).experienceBonus
    : currentMoon(now).phase.experienceBonus;
  return Math.round(experience * (1 + bonus));
}
