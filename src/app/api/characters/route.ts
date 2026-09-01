import { randomUUID, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import * as characterController from "@/controllers/character.controller";
import type { Gender } from "@/models/entities/character";
import { initialState } from "@/models/entities/game-state";
import { failure } from "@/models/entities/result";
import { withTransaction } from "@/models/repositories/server/database";
import {
  insertNewGame,
  isNameCollision,
  loadGame,
  nameTaken,
} from "@/models/repositories/server/game.store";
import { asText, bad, readBody, refuseAbuse, reply, sessionIsLive } from "../_lib/api";
import { sendDepartureNoticeEmail, sendFarewellEmail } from "../_lib/mail";
import { moderationRefusal } from "../_lib/moderation";
import { rateLimit } from "../_lib/rate-limit";
import { deletionCodeHash, dropSession, sessionClaims } from "../_lib/session";
export async function DELETE(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  const userId = claims.userId;
  if (!rateLimit("delete:" + userId, 10, 600000).allowed) {
    return bad("Muitas tentativas. Espere um pouco.", 429);
  }
  const body = await readBody(request);
  const code = asText(body.code, 4).trim();
  if (!/^\d{4}$/.test(code)) {
    return Response.json({
      ok: false,
      message: "Informe o código de 4 dígitos enviado ao seu e-mail.",
      data: null,
    });
  }
  try {
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, claims))) return bad("Sessão encerrada.", 401);
      const pending = await client.query(
        `select code_hash, attempts, expires_at > now() as alive
           from deletion_codes where user_id = $1 for update`,
        [userId],
      );
      const ticket = pending.rows[0];
      if (!ticket || ticket.alive !== true || Number(ticket.attempts) >= 5) {
        return Response.json({
          ok: false,
          message: "O código expirou ou se gastou. Peça um novo.",
          data: null,
        });
      }
      const wanted = Buffer.from(String(ticket.code_hash));
      const given = Buffer.from(deletionCodeHash(userId, code));
      if (wanted.length !== given.length || !timingSafeEqual(wanted, given)) {
        await client.query(
          "update deletion_codes set attempts = attempts + 1 where user_id = $1",
          [userId],
        );
        return Response.json({ ok: false, message: "Código errado. Confira o e-mail.", data: null });
      }
      const found = await client.query(
        `select u.email, c.id as character_id, c.name, c.level from users u
           left join characters c on c.user_id = u.id
          where u.id = $1`,
        [userId],
      );
      const row = found.rows[0];
      if (row?.character_id) {
        await client.query("delete from tavern_messages where author_id = $1", [row.character_id]);
        await client.query("delete from pack_mates where mate_id = $1", [row.character_id]);
      }
      const testAccount = !row?.email || String(row.email).endsWith("@wizold.test");
      if (!testAccount) {
        await client.query(
          `insert into account_departures (id, email, character_name, character_level)
           values ($1, $2, $3, $4)`,
          [
            "dep_" + randomUUID().replaceAll("-", ""),
            String(row.email),
            row.name ?? null,
            row.level === null || row.level === undefined ? null : Number(row.level),
          ],
        );
      }
      const gone = await client.query("delete from users where id = $1", [userId]);
      if (gone.rowCount === 1 && !testAccount) {
        const farewell = String(row.email);
        const name = String(row.name ?? "Caçador");
        const level = Number(row.level ?? 1);
        after(() =>
          sendFarewellEmail(farewell, name).catch((error) =>
            console.error("[mail] despedida", error),
          ),
        );
        after(() =>
          sendDepartureNoticeEmail(farewell, name, level).catch((error) =>
            console.error("[mail] aviso de partida", error),
          ),
        );
      }
      await dropSession();
      return Response.json({
        ok: gone.rowCount === 1,
        message:
          gone.rowCount === 1
            ? "A conta foi apagada por inteiro. A noite guarda a lembrança."
            : "Não havia conta para apagar.",
        data: null,
      });
    });
  } catch (error) {
    console.error("[api] DELETE /api/characters", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;
  const claims = await sessionClaims();
  if (!claims) return bad("Entre para jogar.", 401);
  const userId = claims.userId;
  const gate = rateLimit("create:" + userId, 3, 60000);
  if (!gate.allowed) return bad("Calma: criação de personagem tem ritmo.", 429);
  const body = await readBody(request);
  const name = asText(body.name, 40);
  const gender: Gender = body.gender === "female" ? "female" : "male";
  try {
    return await withTransaction(async (client) => {
      if (!(await sessionIsLive(client, claims))) return bad("Sessão encerrada.", 401);
      const existing = await loadGame(client, userId, true);
      if (existing) {
        return reply({
          ok: false,
          message: "Você já tem uma partida. Encerre a atual antes de recomeçar.",
          state: existing.state,
        });
      }
      const blocked = await moderationRefusal(client, userId, name, "hunter_name");
      if (blocked) return reply(failure(initialState(), blocked));
      const result = characterController.startRun(name, gender);
      if (!result.ok) return reply(result);
      const chosen = result.state.character?.name ?? name;
      if (await nameTaken(client, chosen)) {
        return reply(
          failure(initialState(), "Esse nome já é de outro caçador. Escolha outro."),
        );
      }
      await insertNewGame(client, userId, result.state);
      return reply(result, { data: { characterId: result.state.character?.id } });
    });
  } catch (error) {
    if (isNameCollision(error)) {
      return reply(failure(initialState(), "Esse nome já é de outro caçador. Escolha outro."));
    }
    console.error("[api] POST /api/characters", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
