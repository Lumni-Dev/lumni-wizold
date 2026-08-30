"use client";

// The beat a repeating action reached when it was stopped, banked per job so a
// paused bar resumes where it froze instead of restarting, and so stopping a lap
// never lands its reward: the server is only called when the bar fills, and a
// stop before that just parks the position here. It is a fact of the device, like
// the sound switch, so it lives in localStorage keyed by a job string
// ("mine:bronze-vein", "forge:bronze-claw", "train:strength", "hunt:village-field",
// "arena"). Cleared the moment a cycle lands, so a completed lap always starts the
// next one from zero.
const STORAGE_KEY = "lumni-wizold:progress";

type Bank = Record<string, number>;

function read(): Bank {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Bank) : {};
  } catch {
    return {};
  }
}

function write(bank: Bank): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
  } catch {}
}

export const progressRepository = {
  // The banked beat for a job, floored to a whole beat below the given ceiling so
  // a stale or overreaching value can never skip a whole lap. Zero when nothing is
  // banked.
  get(key: string, ceiling: number): number {
    const value = read()[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
    return Math.min(Math.floor(value), Math.max(0, ceiling - 1));
  },
  set(key: string, beat: number): void {
    const bank = read();
    if (beat > 0) bank[key] = Math.floor(beat);
    else delete bank[key];
    write(bank);
  },
  clear(key: string): void {
    const bank = read();
    if (key in bank) {
      delete bank[key];
      write(bank);
    }
  },
};
