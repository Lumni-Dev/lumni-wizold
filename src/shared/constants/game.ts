import { LIMITS } from "../config/limits";
import { VITALS } from "./tuning/vitals";
import { RECOVERY } from "./tuning/recovery";
import { FURY } from "./tuning/fury";
import { VAULT } from "./tuning/vault";
import { PET } from "./tuning/pet";
import { ECONOMY } from "../config/economy";

export const GAME_NAME = "Wizold";
export const GAME_TAGLINE = "Crônica de Lumni e Luna";

export const STORAGE_KEY = "lumni-wizold:state";
export const STATE_VERSION = 1;

export const LOG_LIMIT = 120;
export const MAX_CHARACTER_LEVEL = LIMITS.characterLevel;
export const MAX_ATTRIBUTE_VALUE = LIMITS.attributeValue;
export const BASE_ATTRIBUTE_VALUE = 4;
export const BASE_VITAL = VITALS.baseVital;
export const HEALTH_PER_ENDURANCE = VITALS.healthPerResistance;
export const HEALTH_PER_LEVEL = VITALS.healthPerLevel;
export const FURY_ATTRIBUTE_BONUS = FURY.attributeBonus;
export const FURY_DURATION_MINUTES = FURY.durationMinutesBySize;
export const FURY_WILLPOWER_MAX_BONUS = FURY.willpowerMaxBonus;
export const FURY_WILLPOWER_SCALE = FURY.willpowerScale;
export const BAU_LIMIT = VAULT.bronzeLimit;
export const STARTING_BRONZE = ECONOMY.startingBronze;
export const REST_TICK_MS = RECOVERY.tickSeconds * 1_000;
export const REST_HEALTH_RATIO = RECOVERY.healthPerTick;
export const RENAME_PRICE = ECONOMY.renamePriceBronze;
export const RENAME_COOLDOWN_DAYS = 15;
export const MIN_HEALTH_RATIO_TO_ACT = 0.2;
export const AUTOMATION_TICK_MS = 2000;
export const HUNT_TICK_MS = 700;
export const CYCLE_OPTOUT_SECS = 3;
export const MAX_COMBAT_ROUNDS = 24;
export const CRITICAL_DAMAGE_BONUS = 0.35;
export const MIN_AGE = 18;
export const NAME_MAX_LENGTH = 25;
export const NAME_MIN_LENGTH = 3;

export const PET_MIN_LEVEL = Math.floor(MAX_CHARACTER_LEVEL / 3);
export const PET_MAX_LEVEL = LIMITS.petLevel;
export const PET_EXERCISE_ID = "pet-training";
export const PET_PRICE = PET.priceBronze;
export const PET_RENAME_PRICE = PET.renamePriceBronze;
export const PET_BASE_BONUS = PET.baseBonus;
export const PET_BASE_ENERGY = PET.baseEnergy;
export const PET_ENERGY_PER_LEVEL = PET.energyPerLevel;
export const PET_ENERGY_PER_HUNT = PET.energyPerHunt;
export const PET_ENERGY_PER_BLOW = PET.energyPerBlow;
export const PET_BITE_ENERGY = PET.biteEnergy;
export const PET_REST_RATIO = PET.restRatio;
export const PET_ATTACK_RATIO = PET.attackRatio;
export const PET_TARGET_CHANCE = PET.targetChance;

export const MAX_ENHANCEMENT = LIMITS.enhancement;
export const ENHANCEMENT_STEP = 0.003;
export const FORGE_SUCCESS_RATIO = 0.75;
export const FORGE_BRONZE_RATIO = 0.2;
export const TRAINING_TICK_MS = 1000;
export const TRAINING_TICKS_MIN = 3;
export const TRAINING_TICKS_MAX = 7;
export const MINING_TICK_MS = 1000;
export const MINING_TICKS_MIN = 3;
export const MINING_TICKS_MAX = 7;
export const MINING_CYCLE_MIN_MS = MINING_TICK_MS * (MINING_TICKS_MIN + 1);
export const MINING_CYCLE_MAX_MS = MINING_TICK_MS * (MINING_TICKS_MAX + 1);
export const MINING_DAILY_MININGS = 200;
export const MINING_RESET_HOUR = 6;
export const MINING_RESET_HOUR_UTC = 9;
export const FORGE_TICKS = 5;
export const FORGE_BASE_MS = 5000;
export const FORGE_MS_PER_LEVEL = 10;
/** Server-side cap for synced bar beats; above any real lap length. */
export const ACTIVITY_BEAT_MAX =
  MAX_COMBAT_ROUNDS + TRAINING_TICKS_MAX + MINING_TICKS_MAX + FORGE_TICKS + 8;
