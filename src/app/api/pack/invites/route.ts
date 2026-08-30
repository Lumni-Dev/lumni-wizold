import { after } from "next/server";
import { failure, success } from "@/models/entities/result";
import type { TavernIdentity } from "@/models/entities/tavern";
import { loadNames } from "@/models/repositories/server/roster.store";
import * as packController from "@/controllers/pack.controller";
import { generateId } from "@/shared/utils/id";
import { asText, withGame } from "../../_lib/api";
import { sendPackInviteEmail } from "../../_lib/mail";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const names = await loadNames(context.client);
    const id = asText(body.id, 80);

    let target: TavernIdentity;
    if (id) {
      const known = names.find((entry) => entry.id === id);
      if (!known) return failure(state, "Esse caçador não está no registro.");
      target = known;
    } else {
      const found = packController.matchNick(asText(body.nick, 60), names);
      if (typeof found === "string") return failure(state, found);
      target = found;
    }

    if (target.id === context.characterId) return failure(state, "Você não convida a si mesmo.");
    if (packController.isInPack(state, target.id)) {
      return failure(state, target.name + " já corre na sua matilha.");
    }

    const inserted = await context.client.query(
      `insert into pack_invites (id, from_id, to_id) values ($1, $2, $3)
       on conflict (from_id, to_id) do nothing`,
      [generateId("inv"), context.characterId, target.id],
    );
    if (inserted.rowCount === 0) {
      return failure(state, "Você já chamou " + target.name + " para a matilha.");
    }

    const contact = await context.client.query(
      "select u.email from users u join characters c on c.user_id = u.id where c.id = $1",
      [target.id],
    );
    const email = contact.rows[0]?.email;
    const inviterName = state.character?.name ?? "Um caçador";
    if (email && !String(email).endsWith("@wizold.test")) {
      after(() =>
        sendPackInviteEmail(String(email), inviterName).catch((error) =>
          console.error("[mail] convite de matilha", error),
        ),
      );
    }

    return success(state, "Convite enviado a " + target.name + ".");
  });
}

export async function GET(request: Request) {
  return withGame(request, async (state, _body, context) => {
    const rows = await context.client.query(
      `select i.id, i.from_id, c.name as from_name, i.created_at
         from pack_invites i join characters c on c.id = i.from_id
        where i.to_id = $1 order by i.created_at desc`,
      [context.characterId],
    );
    const invites = rows.rows.map((row) => ({
      id: String(row.id),
      fromId: String(row.from_id),
      fromName: String(row.from_name),
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    }));
    return success(state, "", { invites });
  });
}
