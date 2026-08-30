import { villageFieldCreatures } from "./village-field";
import { dewWoodsCreatures } from "./dew-woods";
import { mistRidgeCreatures } from "./mist-ridge";
import { paleSwampCreatures } from "./pale-swamp";
import { hunterRoadCreatures } from "./hunter-road";
import { greyWastesCreatures } from "./grey-wastes";
import { stoneNecropolisCreatures } from "./stone-necropolis";
import { howlingAbyssCreatures } from "./howling-abyss";
import { scarletCastleCreatures } from "./scarlet-castle";
import { whiteClearingCreatures } from "./white-clearing";
import type { Creature } from "./types";

export type { Creature, CreatureDrop } from "./types";

export const ALL_CREATURES: readonly Creature[] = [
  ...villageFieldCreatures,
  ...dewWoodsCreatures,
  ...mistRidgeCreatures,
  ...paleSwampCreatures,
  ...hunterRoadCreatures,
  ...greyWastesCreatures,
  ...stoneNecropolisCreatures,
  ...howlingAbyssCreatures,
  ...scarletCastleCreatures,
  ...whiteClearingCreatures,
];

const CREATURE_INDEX = new Map<string, Creature>(
  ALL_CREATURES.map((creature) => [creature.id, creature]),
);

export function findCreature(creatureId: string): Creature | undefined {
  return CREATURE_INDEX.get(creatureId);
}
