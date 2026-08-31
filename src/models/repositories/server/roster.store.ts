import type { PoolClient } from "pg";
import { emptyEquipment, type Equipment, type EquipmentSlot } from "@/models/entities/item";
import type { PetGender } from "@/models/entities/pet";
import type { Hunter, HunterPet } from "@/models/entities/ranking";
import type { TavernIdentity } from "@/models/entities/tavern";

export async function loadHunters(client: PoolClient): Promise<Hunter[]> {
  const characters = await client.query("select * from characters");
  const pets = await client.query(
    "select character_id, name, gender, level, energy, active from pets",
  );
  const equipped = await client.query(
    "select character_id, slot, item_id, enhancement from equipped_items",
  );
  const petBy = new Map<string, HunterPet>();
  for (const row of pets.rows) {
    petBy.set(row.character_id, {
      name: row.name,
      gender: row.gender as PetGender,
      level: Number(row.level),
      energy: Number(row.energy),
      active: row.active !== false,
    });
  }
  const equipmentBy = new Map<string, Equipment>();
  for (const row of equipped.rows) {
    const worn = equipmentBy.get(row.character_id) ?? emptyEquipment();
    worn[row.slot as EquipmentSlot] = {
      itemId: row.item_id,
      enhancement: Number(row.enhancement),
    };
    equipmentBy.set(row.character_id, worn);
  }
  return characters.rows.map((row): Hunter => {
    const equipment = equipmentBy.get(row.id) ?? emptyEquipment();
    const forge = Object.values(equipment).reduce(
      (total, piece) => total + (piece ? piece.enhancement : 0),
      0,
    );
    return {
      id: row.id,
      name: row.name,
      gender: row.gender,
      level: Number(row.level),
      attributes: {
        strength: Number(row.strength),
        agility: Number(row.agility),
        endurance: Number(row.endurance),
        instinct: Number(row.instinct),
        willpower: Number(row.willpower),
      },
      hunts: Number(row.hunts),
      wins: Number(row.wins),
      losses: Number(row.losses),
      arena: Number(row.arena_wins),
      arenaLosses: Number(row.arena_losses),
      bronze: Number(row.bronze),
      forge,
      mining: Number(row.mining_level),
      pet: petBy.get(row.id) ?? null,
      equipment,
    };
  });
}

export async function loadNames(client: PoolClient): Promise<TavernIdentity[]> {
  const found = await client.query("select id, name from characters");
  return found.rows.map((row) => ({ id: row.id, name: row.name }));
}
