import type { GameState } from "./game-state";

export interface Result<T = undefined> {
  ok: boolean;
  message: string;
  state: GameState;
  data?: T;
}

export function failure(state: GameState, message: string): Result<never> {
  return { ok: false, message, state };
}

export function success<T = undefined>(state: GameState, message: string, data?: T): Result<T> {
  return { ok: true, message, state, data };
}
