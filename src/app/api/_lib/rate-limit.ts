interface Window {
  count: number;
  resetAt: number;
}
const windows = new Map<string, Window>();
let lastSweep = 0;
function sweep(now: number): void {
  if (now - lastSweep < 60000) return;
  lastSweep = now;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}
export interface RateVerdict {
  allowed: boolean;
  retryAfterMs: number;
}
export function rateLimit(key: string, limit: number, windowMs: number): RateVerdict {
  const now = Date.now();
  sweep(now);
  const window = windows.get(key);
  if (!window || window.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  window.count += 1;
  if (window.count <= limit) return { allowed: true, retryAfterMs: 0 };
  return { allowed: false, retryAfterMs: window.resetAt - now };
}
