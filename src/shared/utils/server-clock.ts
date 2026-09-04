let offsetMs = 0;

export function noteServerNow(serverNowMs: number): void {
  if (!Number.isFinite(serverNowMs) || serverNowMs <= 0) return;
  offsetMs = serverNowMs - Date.now();
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}
