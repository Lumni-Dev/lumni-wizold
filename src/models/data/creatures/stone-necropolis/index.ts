import { skeletonWarrior } from "./skeleton-warrior";
import { crawlingZombie } from "./crawling-zombie";
import { specter } from "./specter";
import { ghoul } from "./ghoul";
import { deadKnight } from "./dead-knight";
import { banshee } from "./banshee";
import { necromancer } from "./necromancer";
import { gargoyle } from "./gargoyle";
import { lesserLich } from "./lesser-lich";
import { cryptGuardian } from "./crypt-guardian";
import type { Creature } from "../types";

export const stoneNecropolisCreatures: readonly Creature[] = [
  skeletonWarrior,
  crawlingZombie,
  specter,
  ghoul,
  deadKnight,
  banshee,
  necromancer,
  gargoyle,
  lesserLich,
  cryptGuardian,
];
