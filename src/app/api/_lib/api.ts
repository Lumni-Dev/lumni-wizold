import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import type { GameState } from "@/models/entities/game-state";
import type { Result } from "@/models/entities/result";
import type { TavernIdentity, TavernState } from "@/models/entities/tavern";
import { sellerNet } from "@/models/rules/bazaar";
import { expireTransformation } from "@/controllers/character.controller";
import { settleListings } from "@/controllers/bazaar.controller";
import { withTransaction } from "@/models/repositories/server/database";
import {
  loadGame,
  markListingsSold,
  recordWalletMovement,
  saveGame,
  type LoadedGame,
} from "@/models/repositories/server/game.store";
import { loadTavern, lockTavern, pruneStale, type LoadedTavern } from "@/models/repositories/server/tavern.store";
import { sessionUserId } from "./session";

// Every game endpoint is the same sandwich: verify the session, open one
// transaction, load the run with the row lock, let the server clock settle
// what time already decided (fury expiry, bazaar sales), run the SAME pure
// use case the browser used to run, persist, answer. Game-rule refusals are
// ok:false with status 200; only auth and shape problems are HTTP errors.

export interface ApiContext {
  client: PoolClient;
  userId: string;
  characterId: string;
  loaded: LoadedGame;
}

type GameAction<T> = (
  state: GameState,
  body: Record<string, unknown>,
  context: ApiContext,
) => Result<T> | Promise<Result<T>>;

export function reply<T>(result: Result<T>, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({
    ok: result.ok,
    message: result.message,
    data: result.data ?? null,
    ...extra,
  });
}

export function bad(message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, message, data: null }, { status });
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.method === "GET" || request.method === "HEAD") return {};
  try {
    const parsed: unknown = await request.json();
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export const asText = (value: unknown, maximum = 200): string =>
  typeof value === "string" ? value.slice(0, maximum) : "";

export const asInt = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;

/**
 * The server clock lands what already happened before the action runs: an
 * expired fury reverts, and announced pieces whose delay has passed are sold,
 * marked in their rows and paid into the wallet with a movement line.
 */
async function applyClock(
  client: PoolClient,
  characterId: string,
  state: GameState,
): Promise<GameState> {
  let current = expireTransformation(state).state;

  const settled = settleListings(current);
  if (settled.state !== current) {
    const after = new Set(settled.state.bazaarListings.map((listing) => listing.id));
    const sold = current.bazaarListings.filter((listing) => !after.has(listing.id));
    const netById = Object.fromEntries(
      sold.map((listing) => [listing.id, sellerNet(listing.priceCents * listing.quantity)]),
    );
    await markListingsSold(client, sold.map((listing) => listing.id), netById);

    const delta = settled.state.wallet.cents - current.wallet.cents;
    await recordWalletMovement(client, characterId, delta, "bazaar_sale", null);
    current = settled.state;
  }

  return current;
}

export async function withGame<T>(request: Request, action: GameAction<T>): Promise<NextResponse> {
  const userId = await sessionUserId();
  if (!userId) return bad("Entre para jogar.", 401);

  const body = await readBody(request);

  try {
    return await withTransaction(async (client) => {
      const loaded = await loadGame(client, userId, request.method !== "GET");
      if (!loaded) return bad("Nenhum personagem ativo.", 404);

      const baseline =
        request.method === "GET"
          ? loaded.state
          : await applyClock(client, loaded.characterId, loaded.state);

      const context: ApiContext = { client, userId, characterId: loaded.characterId, loaded };
      const result = await action(baseline, body, context);

      if (request.method !== "GET") {
        await saveGame(client, loaded.characterId, baseline, result.state);
      }
      return reply(result);
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}

// The tavern shares one advisory lock: every write replays the same pure
// controller over the whole loaded tavern and persists only the touched rooms.
export interface TavernContext {
  client: PoolClient;
  identity: TavernIdentity;
  tavern: LoadedTavern;
}

export async function withTavern(
  request: Request,
  action: (
    state: TavernState,
    body: Record<string, unknown>,
    context: TavernContext,
  ) => Promise<NextResponse>,
): Promise<NextResponse> {
  const userId = await sessionUserId();
  if (!userId) return bad("Entre para jogar.", 401);

  const body = await readBody(request);

  try {
    return await withTransaction(async (client) => {
      const found = await client.query("select id, name from characters where user_id = $1", [
        userId,
      ]);
      const row = found.rows[0];
      if (!row) return bad("Nenhum personagem ativo.", 404);

      await lockTavern(client);
      await pruneStale(client);
      const tavern = await loadTavern(client);

      return action(tavern.state, body, {
        client,
        identity: { id: row.id, name: row.name },
        tavern,
      });
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
