import { NextResponse } from "next/server";
import {
  computeMoonLocally,
  isWaxing,
  phaseFromAge,
  SYNODIC_MONTH_DAYS,
  type MoonPhaseKey,
} from "@/models/rules/moon";
const MOON_API = "https://api.viewbits.com/v1/moonphase";
const CACHE_SECONDS = 3600;
export const revalidate = 3600;
interface MoonApiEntry {
  date?: string;
  illumination?: string;
  moon_age?: string;
  phase?: string;
}
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
function parseNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
async function moonAnswer() {
  try {
    const response = await fetch(MOON_API, { next: { revalidate: CACHE_SECONDS } });
    if (!response.ok) throw new Error("resposta " + response.status);
    const days: unknown = await response.json();
    if (!Array.isArray(days) || days.length === 0) throw new Error("formato inesperado");
    const entries = days as MoonApiEntry[];
    const entry = entries.find((day) => day.date === today());
    if (!entry) throw new Error("dia atual ausente na resposta");
    const age = parseNumber(entry.moon_age);
    const illumination = parseNumber(entry.illumination);
    if (age === null) throw new Error("idade da lua ausente");
    const wrapped = ((age % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
    const named = entry.phase ? PHASE_BY_NAME[entry.phase.trim().toLowerCase()] : undefined;
    const litFraction = illumination === null ? null : Math.min(1, Math.max(0, illumination / 100));
    return NextResponse.json({
      phase: named ?? phaseFromAge(wrapped).key,
      age: wrapped,
      illumination: litFraction,
      waxing: isWaxing(wrapped),
      source: "api",
    });
  } catch {
    const local = computeMoonLocally();
    return NextResponse.json({
      phase: local.phase.key,
      age: local.age,
      illumination: local.illumination,
      waxing: local.waxing,
      source: "local",
    });
  }
}
export async function GET() {
  return moonAnswer();
}
export async function POST() {
  return moonAnswer();
}
