import * as forgeController from "@/controllers/forge.controller";
import { EQUIPMENT_SLOTS, type EquipmentSlot } from "@/models/entities/item";
import { failure } from "@/models/entities/result";
import { interruptRest } from "@/models/repositories/server/game.store";
import { asText, withGame } from "../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const slot = asText(body.slot, 20) as EquipmentSlot;
    if (!EQUIPMENT_SLOTS.includes(slot)) return failure(state, "Espaço desconhecido.");
    const result = forgeController.enhance(state, slot);
    if (result.ok) await interruptRest(context.client, context.characterId);
    return result;
  });
}
