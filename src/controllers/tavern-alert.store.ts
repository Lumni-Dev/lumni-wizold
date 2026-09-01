"use client";

export interface TavernAlertMessage {
  id: string;
  roomName: string;
  authorName: string;
  text: string;
  at: string;
}

const MAX_ALERTS = 3;

let alerts: TavernAlertMessage[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function pushTavernAlert(message: TavernAlertMessage): void {
  alerts = [message, ...alerts.filter((entry) => entry.id !== message.id)].slice(0, MAX_ALERTS);
  emit();
}

export function dismissTavernAlert(id: string): void {
  const next = alerts.filter((entry) => entry.id !== id);
  if (next.length === alerts.length) return;
  alerts = next;
  emit();
}

export function clearTavernAlerts(): void {
  if (alerts.length === 0) return;
  alerts = [];
  emit();
}

export const tavernAlertStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  snapshot(): TavernAlertMessage[] {
    return alerts;
  },
  serverSnapshot(): TavernAlertMessage[] {
    return [];
  },
};
