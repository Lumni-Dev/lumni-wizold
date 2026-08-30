"use client";

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
