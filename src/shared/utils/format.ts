import { BAU_LIMIT } from "@/shared/constants/game";

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function capBronze(value: number): number {
  return Math.max(0, Math.min(BAU_LIMIT, Math.round(value)));
}
export function percentage(current: number, maximum: number): number {
  if (maximum <= 0) return 0;
  return clamp(Math.round((current / maximum) * 100), 0, 100);
}
const COMPACT_FLOOR = 10000;
const COMPACT_UNITS = [
  { limit: 1e12, suffix: "T" },
  { limit: 1e9, suffix: "B" },
  { limit: 1e6, suffix: "M" },
  { limit: 1e3, suffix: "K" },
];
function decimalsFor(scaled: number): number {
  return Math.abs(scaled) < 100 ? 1 : 0;
}
function toText(value: number, decimals: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}
function formatExact(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}
export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  if (Math.abs(rounded) < COMPACT_FLOOR) return formatExact(rounded);
  for (const unit of COMPACT_UNITS) {
    const scaled = rounded / unit.limit;
    const decimals = decimalsFor(scaled);
    const factor = 10 ** decimals;
    const snapped = Math.round(scaled * factor) / factor;
    if (Math.abs(snapped) >= 1 && Math.abs(snapped) < 1000) {
      return toText(snapped, decimals) + unit.suffix;
    }
  }
  return formatExact(rounded);
}
export function formatVault(value: number): string {
  const rounded = Math.round(value);
  return Math.abs(rounded) >= 1_000_000 ? formatNumber(rounded) : formatExact(rounded);
}
export function formatBronze(value: number): string {
  return formatNumber(value) + (Math.abs(Math.round(value)) === 1 ? " WCoin" : " WCoins");
}
export function formatTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return pad(date.getHours()) + ":" + pad(date.getMinutes());
}
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (value: number) => value.toString().padStart(2, "0");
  return pad(date.getDate()) + "/" + pad(date.getMonth() + 1) + "/" + date.getFullYear();
}

export function formatDay(iso: string): string {
  const date = formatDate(iso);
  return date ? date + " - " + formatTime(iso) : "";
}
export function formatCooldown(milliseconds: number): string {
  const minutes = Math.ceil(milliseconds / 60000);
  return minutes >= 60 ? Math.ceil(minutes / 60) + "h" : minutes + "min";
}

export function formatFuryClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return days + "d " + hours + "h";
  if (hours > 0) return hours + "h " + minutes + "m";
  return minutes + ":" + String(seconds).padStart(2, "0");
}

export function formatFuryDuration(baseMinutes: number, extraMs: number): string {
  const extraSeconds = Math.floor(Math.max(0, extraMs) / 1000);
  const base = String(baseMinutes).replace(".", ",") + " min";
  if (extraSeconds <= 0) return base;
  return base + " (+" + extraSeconds + "s vontade)";
}
export function formatReais(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Math.round(cents) / 100,
  );
}
export function parseReais(text: string): number | null {
  const clean = text.replace(/[Rr$\s]/g, "");
  if (clean.length === 0) return null;
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(clean)
      ? clean.replace(/\./g, "")
      : clean;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}
