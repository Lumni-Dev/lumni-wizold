import { MAX_PACK } from "@/models/entities/pack";
import { failure } from "@/models/entities/result";
import * as packController from "@/controllers/pack.controller";
import { withGame } from "../../../../_lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inviteId = id.slice(0, 80);
  return withGame(request, async (state, _body, context) => {
    const me = state.character;
    if (!me) return failure(state, "Nenhum personagem ativo.");

    const found = await context.client.query(
      `select i.from_id, c.name as from_name from pack_invites i
         join characters c on c.id = i.from_id
        where i.id = $1 and i.to_id = $2`,
      [inviteId, context.characterId],
    );
    const invite = found.rows[0];
    if (!invite) return failure(state, "Esse convite não existe mais.");

    const result = packController.addMate(state, {
      id: String(invite.from_id),
      name: String(invite.from_name),
    });

    await context.client.query("delete from pack_invites where id = $1", [inviteId]);
    if (!result.ok) return result;

    await context.client.query(
      `insert into pack_mates (character_id, mate_id, mate_name, added_at)
         select $1, $2, $3, now()
        where (select count(*) from pack_mates where character_id = $1) < $4
       on conflict (character_id, mate_id) do nothing`,
      [String(invite.from_id), context.characterId, me.name, MAX_PACK],
    );

    return result;
  });
}
