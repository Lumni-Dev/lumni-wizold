"use client";

import { api, type ApiAnswer } from "./api.client";

let chain = Promise.resolve();
let pending = 0;

export function activityThreadBusy(): boolean {
  return pending > 0;
}

export function runActivityThread<T>(work: () => Promise<T>): Promise<T> {
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
