import { villageField } from "./village-field";
import { dewWoods } from "./dew-woods";
import { mistRidge } from "./mist-ridge";
import { paleSwamp } from "./pale-swamp";
import { hunterRoad } from "./hunter-road";
import { greyWastes } from "./grey-wastes";
import { stoneNecropolis } from "./stone-necropolis";
import { howlingAbyss } from "./howling-abyss";
import { scarletCastle } from "./scarlet-castle";
import { whiteClearing } from "./white-clearing";
import type { Territory } from "./types";

export type { Territory, DangerLevel } from "./types";

export const ALL_AREAS: readonly Territory[] = [
  villageField,
  dewWoods,
  mistRidge,
  paleSwamp,
  hunterRoad,
  greyWastes,
  stoneNecropolis,
  howlingAbyss,
  scarletCastle,
  whiteClearing,
];

const AREA_INDEX = new Map<string, Territory>(ALL_AREAS.map((area) => [area.id, area]));

export function findArea(areaId: string): Territory | undefined {
  return AREA_INDEX.get(areaId);
}
