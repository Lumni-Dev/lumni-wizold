import * as characterController from "@/controllers/character.controller";
import type { Gender } from "@/models/entities/character";
import { withTransaction } from "@/models/repositories/server/database";
import { insertNewGame, loadGame } from "@/models/repositories/server/game.store";
import { asText, bad, readBody, refuseAbuse, reply } from "../_lib/api";
import { rateLimit } from "../_lib/rate-limit";
import { sessionUserId } from "../_lib/session";

// Creates the run. The name rule and the single-run-per-user rule are both
// enforced here; the unique index on characters(user_id) backs the second
// one even against a race.
export async function POST(request: Request) {
  const refused = refuseAbuse(request);
  if (refused) return refused;

  const userId = await sessionUserId();
  if (!userId) return bad("Entre para jogar.", 401);

  const gate = rateLimit("create:" + userId, 3, 60_000);
  if (!gate.allowed) return bad("Calma: criação de personagem tem ritmo.", 429);

  const body = await readBody(request);
  const name = asText(body.name, 40);
  const gender: Gender = body.gender === "female" ? "female" : "male";

  try {
    return await withTransaction(async (client) => {
      const existing = await loadGame(client, userId, true);
      if (existing) {
        return reply({
          ok: false,
          message: "Você já tem uma partida. Encerre a atual antes de recomeçar.",
          state: existing.state,
        });
      }

      const result = characterController.startRun(name, gender);
      if (!result.ok) return reply(result);

      await insertNewGame(client, userId, result.state);
      return reply(result, { data: { characterId: result.state.character?.id } });
    });
  } catch (error) {
    console.error("[api] POST /api/characters", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
