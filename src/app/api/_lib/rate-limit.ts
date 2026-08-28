// Sliding-window rate limiter, in memory, per server process. Enough to stop
// a hammering client or a brute-force loop on this single-instance deploy;
// the moment the API runs on more than one instance, the counters move to a
// shared store (Redis or a Postgres table) behind this same function.

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
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
