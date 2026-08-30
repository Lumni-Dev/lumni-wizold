import * as packController from "@/controllers/pack.controller";
import { withGame } from "../../_lib/api";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mateId = id.slice(0, 80);
  return withGame(request, async (state, _body, context) => {
    const result = packController.removeMate(state, mateId);
    // A matilha é mútua: sair da matilha de alguém tira você da dele também.
    if (result.ok) {
      await context.client.query(
        "delete from pack_mates where character_id = $1 and mate_id = $2",
        [mateId, context.characterId],
      );
    }
    return result;
  });
}
