import type { GameState } from "./game-state";

export interface Result<T = undefined> {
  ok: boolean;
  message: string;
  state: GameState;
  data?: T;
}

export function failure<T = never>(state: GameState, message: string, data?: T): Result<T> {
  return { ok: false, message, state, data };
}

export function success<T = undefined>(state: GameState, message: string, data?: T): Result<T> {
  return { ok: true, message, state, data };
}
