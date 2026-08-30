import { pool } from "@/models/repositories/server/database";

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

export async function rateLimitShared(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const found = await pool.query(
      `insert into rate_limits (bucket, window_start, hits) values ($1, now(), 1)
       on conflict (bucket) do update set
         hits = case when rate_limits.window_start < now() - make_interval(secs => $2)
                     then 1 else rate_limits.hits + 1 end,
         window_start = case when rate_limits.window_start < now() - make_interval(secs => $2)
                             then now() else rate_limits.window_start end
       returning hits`,
      [key, windowSeconds],
    );
    return Number(found.rows[0]?.hits ?? 1) <= limit;
  } catch (error) {
    console.error("[rate-limit] shared", error);
    return true;
  }
}
