import * as inventoryController from "@/controllers/inventory.controller";
import { EQUIPMENT_SLOTS, type EquipmentSlot } from "@/models/entities/item";
import { failure } from "@/models/entities/result";
import { readActivity } from "@/models/repositories/server/game.store";
import { asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, async (state, body, context) => {
    const slot = asText(body.slot, 20) as EquipmentSlot;
    if (!EQUIPMENT_SLOTS.includes(slot)) return failure(state, "Unknown space.");
    // The job slot is the server's answer, not the caller's: a tab that hides
    // its own dock, or one that simply lies, still meets the same refusal,
    // and the read rides the transaction withGame already locked.
    const { activity } = await readActivity(context.client, context.characterId);
    return inventoryController.unequipItem(state, slot, activity);
  });
}
