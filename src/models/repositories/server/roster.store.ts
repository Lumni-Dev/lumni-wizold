import type { PoolClient } from "pg";
import type { Equipment } from "@/models/entities/item";
import type { PetGender } from "@/models/entities/pet";
import type { Hunter, HunterPet } from "@/models/entities/ranking";
import type { TavernIdentity } from "@/models/entities/tavern";

export async function loadHunters(client: PoolClient): Promise<Hunter[]> {
  const characters = await client.query("select * from characters");
  const pets = await client.query(
    "select character_id, name, gender, level, energy, active from pets",
  );
  const equipped = await client.query("select character_id, slot, item_id from equipped_items");
  const enhancements = await client.query("select character_id, item_id, level from enhancements");
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
  const equipmentBy = new Map<string, Record<string, string>>();
  for (const row of equipped.rows) {
    const worn = equipmentBy.get(row.character_id) ?? {};
    worn[row.slot] = row.item_id;
    equipmentBy.set(row.character_id, worn);
  }
  const enhancementsBy = new Map<string, Record<string, number>>();
  for (const row of enhancements.rows) {
    const forged = enhancementsBy.get(row.character_id) ?? {};
    forged[row.item_id] = Number(row.level);
    enhancementsBy.set(row.character_id, forged);
  }
  return characters.rows.map((row): Hunter => {
    const equipment = (equipmentBy.get(row.id) ?? {}) as Equipment;
    const forged = enhancementsBy.get(row.id) ?? {};
    const forge = Object.values(equipment).reduce(
      (total, itemId) => total + (itemId ? (forged[itemId] ?? 0) : 0),
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
      bronze: Number(row.bronze),
      forge,
      enhancements: forged,
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
