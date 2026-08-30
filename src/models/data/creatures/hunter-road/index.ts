import { noviceHunter } from "./novice-hunter";
import { roadScout } from "./road-scout";
import { mercenary } from "./mercenary";
import { silverArcher } from "./silver-archer";
import { huntingHound } from "./hunting-hound";
import { maskedBandit } from "./masked-bandit";
import { wanderingKnight } from "./wandering-knight";
import { inquisitor } from "./inquisitor";
import { orderCaptain } from "./order-captain";
import { masterHunter } from "./master-hunter";
import type { Creature } from "../types";

export const hunterRoadCreatures: readonly Creature[] = [
  noviceHunter,
  roadScout,
  mercenary,
  silverArcher,
  huntingHound,
  maskedBandit,
  wanderingKnight,
  inquisitor,
  orderCaptain,
  masterHunter,
];
