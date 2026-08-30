import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import type { GameState } from "@/models/entities/game-state";
import type { Result } from "@/models/entities/result";
import type { TavernIdentity, TavernState } from "@/models/entities/tavern";
import { expireTransformation, syncCharacter } from "@/controllers/character.controller";
import { withTransaction } from "@/models/repositories/server/database";
import { loadGame, saveGame, type LoadedGame } from "@/models/repositories/server/game.store";
import {
  loadRoomState,
  loadTavern,
  lockTavern,
  pruneStale,
  type LoadedTavern,
} from "@/models/repositories/server/tavern.store";
import { syncServerMoon } from "./moon";
import { rateLimit } from "./rate-limit";
import { sessionClaims, type SessionClaims } from "./session";

// A token is only live while its epoch still matches the user's stored epoch;
// "sair de todos os aparelhos" bumps the column and instantly retires every
// token minted before it. Old tokens carry epoch 0, matching the default.
export async function sessionIsLive(client: PoolClient, claims: SessionClaims): Promise<boolean> {
  const found = await client.query("select session_epoch from users where id = $1", [
    claims.userId,
  ]);
  const row = found.rows[0];
  return Boolean(row) && Number(row.session_epoch) === claims.epoch;
}
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
    state: result.state,
    ...extra,
  });
}
export function bad(message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, message, data: null }, { status });
}
const MAX_BODY_BYTES = 16384;
export function clientIp(request: Request): string {
  const cloudflare = request.headers.get("cf-connecting-ip");
  if (cloudflare) return cloudflare.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0].trim() || "local";
}
function tooMany(retryAfterMs: number): NextResponse {
  const response = bad("Calma, lobo: muitas requisições. Respire um instante.", 429);
  response.headers.set("retry-after", String(Math.max(1, Math.ceil(retryAfterMs / 1000))));
  return response;
}
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
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
export const asText = (value: unknown, maximum = 200): string =>
  typeof value === "string" ? value.slice(0, maximum) : "";
export const asInt = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
export const asQuantity = (value: unknown): number => Math.min(999, Math.max(1, asInt(value, 1)));
// The client stamps its running version on every request; keep the users row in
// step so the roster can be watched for stragglers still on an old build. Only a
// plain x.y.z string is stored, and only when it actually changed, so a read
// never writes a dead tuple and a crafted header can never poison the column.
async function recordClientVersion(
  client: PoolClient,
  userId: string,
  reported: string | null,
): Promise<void> {
  if (!reported || !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(reported)) return;
  await client.query(
    "update users set game_version = $1 where id = $2 and game_version is distinct from $1",
    [reported, userId],
  );
}
export async function withGame<T>(request: Request, action: GameAction<T>): Promise<NextResponse> {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  const userId = claims.userId;
  const mutating = request.method !== "GET";
  const gate = rateLimit((mutating ? "act:" : "read:") + userId, mutating ? 30 : 60, 10000);
  if (!gate.allowed) return tooMany(gate.retryAfterMs);
  const body = await readBody(request);
  await syncServerMoon();
  try {
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, claims))) return bad("Sessão encerrada.", 401);
      const loaded = await loadGame(client, userId, request.method !== "GET");
      if (!loaded) return bad("Nenhum personagem ativo.", 404);
      const baseline = syncCharacter(
        request.method === "GET" ? loaded.state : expireTransformation(loaded.state).state,
      );
      const context: ApiContext = { client, userId, characterId: loaded.characterId, loaded };
      const result = await action(baseline, body, context);
      if (request.method !== "GET") {
        await saveGame(client, loaded.characterId, loaded.state, result.state);
        await recordClientVersion(client, userId, request.headers.get("x-game-version"));
      }
      return reply(result);
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
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
async function tavernIdentity(client: PoolClient, userId: string): Promise<TavernIdentity | null> {
  const found = await client.query("select id, name, level from characters where user_id = $1", [
    userId,
  ]);
  const row = found.rows[0];
  return row ? { id: row.id, name: row.name, level: Number(row.level) } : null;
}
async function guardTavern(request: Request): Promise<SessionClaims | NextResponse> {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  const gate = rateLimit("tavern:" + claims.userId, 30, 10000);
  if (!gate.allowed) return tooMany(gate.retryAfterMs);
  return claims;
}
export async function withTavern(
  request: Request,
  action: TavernAction,
  options: {
    write?: boolean;
  } = {},
): Promise<NextResponse> {
  const guarded = await guardTavern(request);
  if (guarded instanceof NextResponse) return guarded;
  const body = await readBody(request);
  try {
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, guarded))) return bad("Sessão encerrada.", 401);
      const identity = await tavernIdentity(client, guarded.userId);
      if (!identity) return bad("Nenhum personagem ativo.", 404);
      if (options.write) await lockTavern(client);
      await pruneStale(client);
      const tavern = await loadTavern(client);
      return action(tavern.state, body, { client, identity, tavern });
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
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
      if (!(await sessionIsLive(client, guarded))) return bad("Sessão encerrada.", 401);
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
export async function withIdentity(
  request: Request,
  action: (identity: TavernIdentity, client: PoolClient) => Promise<NextResponse>,
): Promise<NextResponse> {
  const guarded = await guardTavern(request);
  if (guarded instanceof NextResponse) return guarded;
  try {
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, guarded))) return bad("Sessão encerrada.", 401);
      const identity = await tavernIdentity(client, guarded.userId);
      if (!identity) return bad("Nenhum personagem ativo.", 404);
      return action(identity, client);
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
