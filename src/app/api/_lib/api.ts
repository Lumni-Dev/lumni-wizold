import { NextResponse } from "next/server";
import type { PoolClient } from "pg";
import type { GameState } from "@/models/entities/game-state";
import type { Result } from "@/models/entities/result";
import type { TavernIdentity, TavernState } from "@/models/entities/tavern";
import { isVip } from "@/models/rules/vip";
import { syncCharacter } from "@/controllers/character.controller";
import { withTransaction, withReadOnly } from "@/models/repositories/server/database";
import { loadGame, readActivity, saveGame, type LoadedGame } from "@/models/repositories/server/game.store";
import {
  loadRoomState,
  loadTavern,
  lockTavern,
  pruneStale,
  type LoadedTavern,
} from "@/models/repositories/server/tavern.store";
import { loadTavernCached } from "./tavern-snapshot-cache";
import { originAllowed } from "./cors";
import { syncServerMoon } from "./moon";
import { rateLimit } from "./rate-limit";
import { sessionClaims, type SessionClaims } from "./session";

export async function sessionIsLive(client: PoolClient, claims: SessionClaims): Promise<boolean> {
  const gate = await sessionGate(client, claims);
  return gate.live;
}

async function sessionGate(
  client: PoolClient,
  claims: SessionClaims,
): Promise<{ live: boolean; tutorial: boolean }> {
  const found = await client.query(
    "select session_epoch, tutorial, banished from users where id = $1",
    [claims.userId],
  );
  const row = found.rows[0];
  if (!row) return { live: false, tutorial: false };
  return {
    live: Number(row.session_epoch) === claims.epoch && row.banished !== true,
    tutorial: row.tutorial === true,
  };
}

export async function withSessionRead(
  request: Request,
  action: (client: PoolClient, userId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  const gate = rateLimit("read:" + claims.userId, 60, 10000);
  if (!gate.allowed) return tooMany(gate.retryAfterMs);
  try {
    return await withReadOnly(async (client) => {
      if (!(await sessionIsLive(client, claims))) return bad("Sessão encerrada.", 401);
      return action(client, claims.userId);
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}

export async function withActivityLock(
  request: Request,
  action: (client: PoolClient, characterId: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  const gate = rateLimit("act:" + claims.userId, 30, 10000);
  if (!gate.allowed) return tooMany(gate.retryAfterMs);
  try {
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, claims))) return bad("Sessão encerrada.", 401);
      const found = await client.query<{ id: string }>(
        "select id from characters where user_id = $1 for update",
        [claims.userId],
      );
      const characterId = found.rows[0]?.id;
      if (!characterId) return bad("Nenhum personagem ativo.", 404);
      return action(client, characterId);
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
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
  if (request.method !== "GET" && request.method !== "HEAD" && request.headers.get("origin")) {
    if (!originAllowed(request)) return bad("Origem não permitida.", 403);
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
        loaded.state,
      );
      const context: ApiContext = { client, userId, characterId: loaded.characterId, loaded };
      const result = await action(baseline, body, context);
      if (request.method !== "GET") {
        await saveGame(client, loaded.characterId, loaded.state, result.state);
        await recordClientVersion(client, userId, request.headers.get("x-game-version"));
      }
      const { tutorial } = await sessionGate(client, claims);
      const { activity } = await readActivity(client, loaded.characterId);
      return reply(result, { tutorial, activity });
    });
  } catch (error) {
    console.error("[api]", request.method, new URL(request.url).pathname, error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
export interface TavernContext {
  client: PoolClient;
  userId: string;
  identity: TavernIdentity;
  tavern: LoadedTavern;
}
type TavernAction = (
  state: TavernState,
  body: Record<string, unknown>,
  context: TavernContext,
) => Promise<NextResponse>;
async function tavernIdentity(client: PoolClient, userId: string): Promise<TavernIdentity | null> {
  const found = await client.query(
    "select id, name, level, vip_until from characters where user_id = $1",
    [userId],
  );
  const row = found.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    level: Number(row.level),
    vip: isVip(
      { vipUntil: row.vip_until ? new Date(row.vip_until).toISOString() : undefined },
      Date.now(),
    ),
  };
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
      if (options.write) {
        await lockTavern(client);
        if (await pruneStale(client)) {
          const { bumpTavernRevision } = await import("./tavern-board");
          const { publishTavernRevision } = await import("./tavern-bus");
          publishTavernRevision(await bumpTavernRevision(client));
        }
      }
      const tavern = options.write ? await loadTavern(client) : await loadTavernCached(client);
      return action(tavern.state, body, { client, userId: guarded.userId, identity, tavern });
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
      return action(tavern.state, body, { client, userId: guarded.userId, identity, tavern });
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
