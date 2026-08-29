import type { BirthDate } from "@/shared/utils/birth";

const KEY = "lumni-wizold:birth";

export function loadBirth(): BirthDate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    const day = typeof record.day === "string" ? record.day : "";
    const month = typeof record.month === "string" ? record.month : "";
    const year = typeof record.year === "string" ? record.year : "";
    if (!/^\d{1,2}$/.test(day) || !/^\d{1,2}$/.test(month) || !/^\d{4}$/.test(year)) return null;
    return { day, month, year };
  } catch {
    return null;
  }
}

export function saveBirth(birth: BirthDate): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(birth));
  } catch {}
}
