import type { GameState } from "@/models/entities/game-state";
import { GAME_VERSION } from "@/shared/constants/version";
export interface ApiAnswer<T> {
  ok: boolean;
  status: number;
  message: string;
  data: T | null;
  state: GameState | null;
  version: string | null;
}
export async function api<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<ApiAnswer<T>> {
  try {
    const response = await fetch(path, {
      method,
      headers: {
        "x-game-version": GAME_VERSION,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let payload: {
      ok?: boolean;
      message?: string;
      data?: T;
      state?: GameState;
      version?: string;
    } | null = null;
    try {
      payload = await response.json();
    } catch {}
    return {
      ok: payload?.ok === true,
      status: response.status,
      message:
        payload?.message ??
        (response.status === 429
          ? "Calma, lobo: muitas requisições. Respire um instante."
          : "O servidor não respondeu direito."),
      data: payload?.data ?? null,
      state: payload?.state ?? null,
      version: payload?.version ?? null,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Sem conexão com o servidor. Verifique a rede e tente de novo.",
      data: null,
      state: null,
      version: null,
    };
  }
}
