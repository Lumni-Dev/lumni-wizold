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
import {
  loadRoomState,
  loadTavern,
  lockTavern,
  pruneStale,
  type LoadedTavern,
} from "@/models/repositories/server/tavern.store";
import { rateLimit } from "./rate-limit";
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

// Every game answer carries the whole run as the server now knows it: the
// client never guesses a delta, it just adopts the newest truth it received.
export function reply<T>(result: Result<T>, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({
    ok: result.ok,
    message: result.message,
    data: result.data ?? null,
    state: result.state,
    ...extra,
  });
}

export function bad(message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, message, data: null }, { status });
}

const MAX_BODY_BYTES = 16_384;

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0].trim() || "local";
}

function tooMany(retryAfterMs: number): NextResponse {
  const response = bad("Calma, lobo: muitas requisições. Respire um instante.", 429);
  response.headers.set("retry-after", String(Math.max(1, Math.ceil(retryAfterMs / 1000))));
  return response;
}

/**
 * Refuses what no legitimate client ever sends before any work happens: a
 * cross-origin mutation (CSRF armor on top of the sameSite cookie) and a body
 * beyond any real payload of this game. Returns null when the shape is sane.
 */
export function refuseAbuse(request: Request): NextResponse | null {
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== new URL(request.url).host) {
          return bad("Origem não permitida.", 403);
        }
      } catch {
        return bad("Origem não permitida.", 403);
      }
    }
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return bad("Corpo da requisição grande demais.", 413);

  return null;
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

// One call moves at most 999 of anything: enough for any honest trade, small
// enough that nobody inflates a state (or a non-stackable bag) in one request.
export const asQuantity = (value: unknown): number =>
  Math.min(999, Math.max(1, asInt(value, 1)));

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
  const refused = refuseAbuse(request);
  if (refused) return refused;

  const userId = await sessionUserId();
  if (!userId) return bad("Entre para jogar.", 401);

  const mutating = request.method !== "GET";
  const gate = rateLimit(
    (mutating ? "act:" : "read:") + userId,
    mutating ? 30 : 60,
    10_000,
  );
  if (!gate.allowed) return tooMany(gate.retryAfterMs);

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

type TavernAction = (
  state: TavernState,
  body: Record<string, unknown>,
  context: TavernContext,
) => Promise<NextResponse>;

async function tavernIdentity(
  client: PoolClient,
  userId: string,
): Promise<TavernIdentity | null> {
  const found = await client.query("select id, name from characters where user_id = $1", [userId]);
  const row = found.rows[0];
  return row ? { id: row.id, name: row.name } : null;
}

async function guardTavern(request: Request): Promise<{ userId: string } | NextResponse> {
  const refused = refuseAbuse(request);
  if (refused) return refused;

  const userId = await sessionUserId();
  if (!userId) return bad("Entre para jogar.", 401);

  const gate = rateLimit("tavern:" + userId, 30, 10_000);
  if (!gate.allowed) return tooMany(gate.retryAfterMs);

  return { userId };
}

/**
 * Whole-tavern operations: creating a table and reserving a direct one need
 * the global view (name clash, one table per owner, the pair lookup), so they
 * serialize under the advisory lock. Reads skip the lock entirely.
 */
export async function withTavern(
  request: Request,
  action: TavernAction,
): Promise<NextResponse> {
  const guarded = await guardTavern(request);
  if (guarded instanceof NextResponse) return guarded;

  const body = await readBody(request);

  try {
    return await withTransaction(async (client) => {
      const identity = await tavernIdentity(client, guarded.userId);
      if (!identity) return bad("Nenhum personagem ativo.", 404);

      if (request.method !== "GET") await lockTavern(client);
      await pruneStale(client);
      const tavern = await loadTavern(client);

      return action(tavern.state, body, { client, identity, tavern });
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}

/**
 * Single-room operations (join, leave, close, speak): the room row itself is
 * the lock, so two tables never wait for each other and the chat scales by
 * room instead of by tavern.
 */
export async function withTavernRoom(
  request: Request,
  roomId: string,
  action: TavernAction,
): Promise<NextResponse> {
  const guarded = await guardTavern(request);
  if (guarded instanceof NextResponse) return guarded;

  const body = await readBody(request);

  try {
    return await withTransaction(async (client) => {
      const identity = await tavernIdentity(client, guarded.userId);
      if (!identity) return bad("Nenhum personagem ativo.", 404);

      const tavern = await loadRoomState(client, roomId, true);
      return action(tavern.state, body, { client, identity, tavern });
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}

/**
 * The lightest lane: identity only, for the heartbeat that must cost close
 * to nothing under load.
 */
export async function withIdentity(
  request: Request,
  action: (identity: TavernIdentity, client: PoolClient) => Promise<NextResponse>,
): Promise<NextResponse> {
  const guarded = await guardTavern(request);
  if (guarded instanceof NextResponse) return guarded;

  try {
    return await withTransaction(async (client) => {
      const identity = await tavernIdentity(client, guarded.userId);
      if (!identity) return bad("Nenhum personagem ativo.", 404);
      return action(identity, client);
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
