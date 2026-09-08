import type { Activity } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import { languageRepository } from "@/models/repositories/language.repository";
import { GAME_VERSION } from "@/shared/constants/version";
import { noteServerNow } from "@/shared/utils/server-clock";
export function isTransientApiMessage(message: string): boolean {
  return (
    message === "" ||
    message.startsWith("No connection") ||
    message === "The server did not answer properly."
  );
}

export interface ApiAnswer<T> {
  ok: boolean;
  status: number;
  message: string;
  data: T | null;
  state: GameState | null;
  activity: Activity | null | undefined;
  version: string | null;
  tutorial: boolean | null;
}
export async function api<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<ApiAnswer<T>> {
  try {
    const response = await fetch(path, {
      method,
      cache: "no-store",
      headers: {
        "x-game-version": GAME_VERSION,
        "x-game-locale": languageRepository.resolved(),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let payload: {
      ok?: boolean;
      message?: string;
      data?: T;
      state?: GameState;
      activity?: Activity | null;
      version?: string;
      tutorial?: boolean;
      now?: number;
    } | null = null;
    try {
      payload = await response.json();
    } catch {}
    if (typeof payload?.now === "number") noteServerNow(payload.now);
    return {
      ok: payload?.ok === true,
      status: response.status,
      message:
        payload?.message ??
        (response.status === 429
          ? "Easy, wolf: too many requests. Breathe for a moment."
          : "The server did not answer properly."),
      data: payload?.data ?? null,
      state: payload?.state ?? null,
      activity: payload && "activity" in payload ? (payload.activity ?? null) : undefined,
      version: payload?.version ?? null,
      tutorial: typeof payload?.tutorial === "boolean" ? payload.tutorial : null,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "No connection to the server. Check the network and try again.",
      data: null,
      state: null,
      activity: undefined,
      version: null,
      tutorial: null,
    };
  }
}
