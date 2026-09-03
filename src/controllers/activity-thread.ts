"use client";

import { api, type ApiAnswer } from "./api.client";
import { GAME_VERSION } from "@/shared/constants/version";

let chain = Promise.resolve();
let pending = 0;

export function activityThreadBusy(): boolean {
  return pending > 0;
}

function runActivityThread<T>(work: () => Promise<T>): Promise<T> {
  pending += 1;
  const job = chain.then(work);
  chain = job.then(
    () => undefined,
    () => undefined,
  );
  return job.finally(() => {
    pending -= 1;
  });
}

export function activityApi<T>(
  method: "PUT" | "PATCH",
  path: string,
  body?: unknown,
): Promise<ApiAnswer<T>> {
  return runActivityThread(() => api<T>(method, path, body));
}

export function activitySlotRoute(method: string, path: string): boolean {
  if (path === "/api/activity" || path === "/api/activity/progress") return true;
  if (path === "/api/character/rest" && (method === "POST" || method === "PATCH")) return true;
  return false;
}

export function activityQueuedApi<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<ApiAnswer<T>> {
  return runActivityThread(() => api<T>(method, path, body));
}

export function flushActivityKeepalive(
  method: "PUT" | "PATCH",
  path: string,
  body: unknown,
): void {
  try {
    void fetch(path, {
      method,
      headers: {
        "content-type": "application/json",
        "x-game-version": GAME_VERSION,
      },
      body: JSON.stringify(body),
      keepalive: true,
      credentials: "same-origin",
    });
  } catch {}
}
