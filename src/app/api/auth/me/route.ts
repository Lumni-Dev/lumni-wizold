import { NextResponse } from "next/server";
import { withTransaction } from "@/models/repositories/server/database";
import { loadGame } from "@/models/repositories/server/game.store";
import { bad } from "../../_lib/api";
import { sessionUserId } from "../../_lib/session";

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return bad("Sem sessão.", 401);

  try {
    return await withTransaction(async (client) => {
      const loaded = await loadGame(client, userId, false);
      return NextResponse.json({
        ok: true,
        message: "",
        data: { userId, hasCharacter: loaded !== null },
      });
    });
  } catch (error) {
    console.error("[api] GET /api/auth/me", error);
    return bad("O servidor tropeçou. Tente de novo.", 500);
  }
}
