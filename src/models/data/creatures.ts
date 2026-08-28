import type { Creature } from "../entities/creature";
import { buildCreatures } from "./species";

export const CREATURES: readonly Creature[] = buildCreatures();

const CREATURE_INDEX = new Map<string, Creature>(
  CREATURES.map((creature) => [creature.id, creature]),
);

export function findCreature(creatureId: string): Creature | undefined {
  return CREATURE_INDEX.get(creatureId);
}
