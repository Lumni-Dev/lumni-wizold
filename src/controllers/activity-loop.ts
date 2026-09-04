"use client";

const DEFAULT_POLL_MS = 250;

export function createDriftLoop(options: {
  periodMs: number;
  pollMs?: number;
  alive: () => boolean;
  ready: () => boolean;
  onTick: () => void;
  catchUp?: boolean;
}): () => void {
  const pollMs = options.pollMs ?? Math.min(DEFAULT_POLL_MS, options.periodMs);
  const catchUp = options.catchUp !== false;
  let nextAt = Date.now() + options.periodMs;
  let armed = options.ready();

  const flush = () => {
    if (!options.alive()) return;
    if (!options.ready()) {
      armed = false;
      return;
    }
    const now = Date.now();
    if (!armed) {
      armed = true;
      nextAt = catchUp ? now + options.periodMs : now;
      if (catchUp) return;
    }
    let guard = 0;
    while (now >= nextAt && options.alive() && options.ready() && guard < 512) {
      options.onTick();
      nextAt += options.periodMs;
      guard += 1;
      if (!catchUp) {
        nextAt = now + options.periodMs;
        break;
      }
    }
  };

  const poll = window.setInterval(flush, pollMs);
  const onVisible = () => {
    if (document.visibilityState === "visible") flush();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    window.clearInterval(poll);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export function cooldownSecondsLeft(until: string | null | undefined): number {
  if (!until) return 0;
  return Math.max(0, Math.ceil((Date.parse(until) - Date.now()) / 1000));
}

export function createCooldownLoop(options: {
  until: () => string | null | undefined;
  alive: () => boolean;
  onTick: (left: number) => void;
  onDone: () => void;
}): () => void {
  const tick = () => {
    if (!options.alive()) return;
    const left = cooldownSecondsLeft(options.until());
    options.onTick(left);
    if (left <= 0) {
      window.clearInterval(poll);
      options.onDone();
    }
  };

  tick();
  const poll = window.setInterval(tick, 250);
  return () => window.clearInterval(poll);
}
