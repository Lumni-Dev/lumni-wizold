import * as inventoryController from "@/controllers/inventory.controller";
import { EQUIPMENT_SLOTS, type EquipmentSlot } from "@/models/entities/item";
import { failure } from "@/models/entities/result";
import { asText, withGame } from "../../_lib/api";

export async function POST(request: Request) {
  return withGame(request, (state, body) => {
    const slot = asText(body.slot, 20) as EquipmentSlot;
    if (!EQUIPMENT_SLOTS.includes(slot)) return failure(state, "Espaço desconhecido.");
    return inventoryController.unequipItem(state, slot);
  });
}
