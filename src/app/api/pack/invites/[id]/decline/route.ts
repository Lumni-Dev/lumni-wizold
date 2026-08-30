import { failure, success } from "@/models/entities/result";
import { withGame } from "../../../../_lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inviteId = id.slice(0, 80);
  return withGame(request, async (state, _body, context) => {
    const gone = await context.client.query(
      "delete from pack_invites where id = $1 and to_id = $2",
      [inviteId, context.characterId],
    );
    if (gone.rowCount === 0) return failure(state, "Esse convite não existe mais.");
    return success(state, "Convite recusado.");
  });
}
