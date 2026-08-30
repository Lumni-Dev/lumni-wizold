import { numberFromEnv } from "@/shared/utils/env";
import { VITALS } from "./tuning/vitals";
import { RECOVERY } from "./tuning/recovery";
import { FURY } from "./tuning/fury";
import { VAULT } from "./tuning/vault";
import { PET } from "./tuning/pet";

export const GAME_NAME = "Wizold";
export const GAME_TAGLINE = "Crônica de Lumni e Luna";

export const STORAGE_KEY = "lumni-wizold:state";
export const STATE_VERSION = 1;

export const LOG_LIMIT = 120;
export const MAX_CHARACTER_LEVEL = numberFromEnv(
  process.env.NEXT_PUBLIC_MAX_CHARACTER_LEVEL,
  1000,
);
export const MAX_ATTRIBUTE_VALUE = 1000;
export const BASE_ATTRIBUTE_VALUE = 4;
export const BASE_VITAL = VITALS.baseVital;
export const HEALTH_PER_ENDURANCE = VITALS.healthPerResistance;
export const HEALTH_PER_LEVEL = VITALS.healthPerLevel;
export const FURY_ATTRIBUTE_BONUS = FURY.attributeBonus;
export const FURY_DURATION_MINUTES = FURY.durationMinutesBySize;
export const BAU_LIMIT = VAULT.bronzeLimit;
export const STARTING_BRONZE = 100;
export const REST_TICK_MS = RECOVERY.tickSeconds * 1_000;
export const REST_HEALTH_RATIO = RECOVERY.healthPerTick;
export const RENAME_COOLDOWN_DAYS = 15;
export const RENAME_PRICE = 50_000;
export const MIN_HEALTH_RATIO_TO_ACT = 0.2;
export const AUTOMATION_TICK_MS = 2000;
export const HUNT_TICK_MS = 1400;
export const HUNT_TICKS = 8;
// The short approach a hunt or duel fills before the fight resolves: stopping
// here cancels and banks the position, and only when it tops out does the server
// settle the fight, which then plays out live over the returned rounds.
export const HUNT_APPROACH_TICKS = 3;
export const MAX_COMBAT_ROUNDS = 24;
export const CRITICAL_DAMAGE_BONUS = 0.35;
export const MIN_AGE = 18;
export const NAME_MAX_LENGTH = 25;
export const NAME_MIN_LENGTH = 3;

// The wolf is a mid-run commitment: adopted at a third of the ceiling. The adoption
// level and the pet ceiling stay here (they depend on the level cap and the env);
// every other pet number lives in tuning/pet.ts.
export const PET_MIN_LEVEL = Math.floor(MAX_CHARACTER_LEVEL / 3);
export const PET_MAX_LEVEL = numberFromEnv(process.env.NEXT_PUBLIC_PET_MAX_LEVEL, 1000);
export const PET_EXERCISE_ID = "pet-training";
export const PET_PRICE = PET.price;
export const PET_RENAME_PRICE = PET.renamePrice;
export const PET_BASE_BONUS = PET.baseBonus;
export const PET_BASE_ENERGY = PET.baseEnergy;
export const PET_ENERGY_PER_LEVEL = PET.energyPerLevel;
export const PET_ENERGY_PER_HUNT = PET.energyPerHunt;
export const PET_ENERGY_PER_BLOW = PET.energyPerBlow;
export const PET_BITE_ENERGY = PET.biteEnergy;
export const PET_REST_RATIO = PET.restRatio;
export const PET_ATTACK_RATIO = PET.attackRatio;
export const PET_TARGET_CHANCE = PET.targetChance;

export const MAX_ENHANCEMENT = numberFromEnv(process.env.NEXT_PUBLIC_MAX_ENHANCEMENT, 1000);
export const ENHANCEMENT_STEP = 0.003;
export const FORGE_SUCCESS_RATIO = 0.75;
export const FORGE_BRONZE_RATIO = 0.15;
export const TRAINING_TICK_MS = 1000;
export const TRAINING_TICKS = 5;
export const MINING_TICK_MS = 1000;
export const MINING_TICKS = 5;
export const MINING_CYCLE_MS = MINING_TICK_MS * (MINING_TICKS + 1);
// The mine gives out only so many pulls each day: a fixed count of completed
// minings (a landed fragment yield, not each swing of the pick). The count is
// the same for everyone and refills at 06:00 America/Sao_Paulo, the game's one
// timezone, which holds UTC-3 year-round (no DST since 2019), so the daily
// boundary is 09:00 UTC.
export const MINING_DAILY_MININGS = 100;
export const MINING_RESET_HOUR = 6;
export const MINING_RESET_HOUR_UTC = 9;
export const FORGE_TICKS = 5;
export const FORGE_BASE_MS = 5000;
export const FORGE_MS_PER_LEVEL = 10;
