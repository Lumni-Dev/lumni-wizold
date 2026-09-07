import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SIM = join(ROOT, ".sim-audit");
execFileSync("npx", ["tsc", "-p", join(HERE, "tsconfig.audit.json")], {
  cwd: ROOT,
  stdio: ["ignore", "ignore", "inherit"],
  shell: true,
});
const resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) request = join(SIM, request.slice(2));
  return resolveFilename.call(this, request, ...rest);
};
const require = createRequire(import.meta.url);
const load = (path) => require(join(SIM, path));
const CONST = load("shared/constants/game.js");
const { seededRandom } = load("shared/utils/random.js");
const { sanitizeName, sanitizeRoomSearch, normalizeText, splitChatLinks } = load(
  "shared/utils/text.js",
);
const { clamp, formatBronze, parseReais } = load("shared/utils/format.js");
const stats = load("models/rules/stats.js");
const combat = load("models/rules/combat.js");
const progression = load("models/rules/progression.js");
const training = load("models/rules/training.js");
const arena = load("models/rules/arena.js");
const petRules = load("models/rules/pet.js");
const forgeRules = load("models/rules/forge.js");
const miningRules = load("models/rules/mining.js");
const bazaarRules = load("models/rules/bazaar.js");
const moon = load("models/rules/moon.js");
const presenceRules = load("models/rules/presence.js");
const storeRules = load("models/rules/store.js");
const rankingRules = load("models/rules/ranking.js");
const species = load("models/data/species.js");
const sets = load("models/data/equipment-sets.js");
const items = load("models/data/items.js");
const creaturesData = load("models/data/creatures.js");
const territoriesData = load("models/data/territories.js");
const packsData = load("models/data/store-packs.js");
const exercisesData = load("models/data/exercises.js");
const entItem = load("models/entities/item.js");
const oresData = load("models/data/ores/index.js");
const entTavern = load("models/entities/tavern.js");
const entActivity = load("models/entities/activity.js");
const entRanking = load("models/entities/ranking.js");
const entBazaar = load("models/entities/bazaar.js");
const factory = load("models/factories/character.factory.js");
const characterCtrl = load("controllers/character.controller.js");
const huntCtrl = load("controllers/hunt.controller.js");
const arenaCtrl = load("controllers/arena.controller.js");
const inventoryCtrl = load("controllers/inventory.controller.js");
const marketCtrl = load("controllers/market.controller.js");
const bazaarCtrl = load("controllers/bazaar.controller.js");
const trainingCtrl = load("controllers/training.controller.js");
const petCtrl = load("controllers/pet.controller.js");
const forgeCtrl = load("controllers/forge.controller.js");
const storeCtrl = load("controllers/store.controller.js");
const automationCtrl = load("controllers/automation.controller.js");
const rankingCtrl = load("controllers/ranking.controller.js");
const packCtrl = load("controllers/pack.controller.js");
const logCtrl = load("controllers/log.controller.js");
const tavernCtrl = load("controllers/tavern.controller.js");
const huntPresenter = load("views/presenters/hunt.presenter.js");
function setMoon(key) {
  moon.applyMoonState({
    phase: moon.findMoonPhase(key),
    age: 1,
    illumination: 0,
    waxing: key === "waxing",
    source: "local",
  });
}
setMoon("waning");
let failures = 0;
let checks = 0;
let section = "";
const problems = [];
function sec(name) {
  section = name;
}
function ok(name, condition, detail = "") {
  checks += 1;
  if (condition) return;
  failures += 1;
  problems.push(section + " :: " + name + (detail ? " :: " + String(detail) : ""));
}
function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return value;
}
const json = (value) => JSON.stringify(value);
const isInt = (value) => Number.isInteger(value);
function baseState({ level = 1, gender = "male", bronze = 700000 } = {}) {
  const state = factory.createRun("Teste", gender);
  const trained = clamp(Math.round(level * 0.55), CONST.BASE_ATTRIBUTE_VALUE, 1000);
  state.character = {
    ...state.character,
    level,
    bronze,
    attributes: {
      strength: trained,
      agility: trained,
      endurance: trained,
      instinct: trained,
      willpower: trained,
    },
  };
  const derived = stats.deriveStats(state.character, state.equipment, state.pet);
  state.character.health = derived.maxHealth;
  return state;
}
function benchHunter(id, level, over = {}) {
  const trained = clamp(Math.round(level * 0.55), CONST.BASE_ATTRIBUTE_VALUE, 1000);
  return {
    id,
    name: "Par" + id.replaceAll(/[^A-Za-z0-9]/g, ""),
    gender: "male",
    level,
    attributes: {
      strength: trained,
      agility: trained,
      endurance: trained,
      instinct: trained,
      willpower: trained,
    },
    hunts: 10,
    wins: 6,
    losses: 4,
    arena: 0,
    bronze: 5000,
    forge: 0,
    mining: 1,
    pet: null,
    equipment: entItem.emptyEquipment(),
    ...over,
  };
}
sec("stats");
{
  for (const level of [1, 7, 83, 165, 170, 340, 505, 670, 999, 1000]) {
    const trained = clamp(Math.round(level * 0.55), 4, 1000);
    const attrs = {
      strength: trained,
      agility: trained,
      endurance: trained,
      instinct: trained,
      willpower: trained,
    };
    const derived = stats.deriveStatsOf({ level, attributes: attrs }, entItem.emptyEquipment());
    const t = derived.totalAttributes;
    ok(
      "health by the formula LV " + level,
      derived.maxHealth ===
        Math.round(
          CONST.BASE_VITAL +
            (t.endurance - CONST.BASE_ATTRIBUTE_VALUE) * CONST.HEALTH_PER_ENDURANCE +
            Math.max(0, level - 1) * CONST.HEALTH_PER_LEVEL.male,
        ),
    );
    ok(
      "esquiva na curva NV " + level,
      derived.dodge === clamp(Math.round((35 * t.agility) / (t.agility + 120)), 0, 35),
    );
    ok(
      "critical on the curve LV " + level,
      derived.critical === clamp(Math.round(5 + (40 * t.instinct) / (t.instinct + 250)), 0, 45),
    );
    const sourceSum = (key) =>
      derived.sources.trained[key] +
      derived.sources.equipment[key] +
      derived.sources.pet[key] +
      derived.sources.moon[key] +
      derived.sources.fury[key];
    for (const key of ["strength", "agility", "endurance", "instinct", "willpower"]) {
      ok("sources add to the total (" + key + ")", sourceSum(key) === t[key]);
    }
    ok("without buff, the fury source is zero LV " + level, derived.sources.fury.strength === 0);
    const buffed = stats.deriveStatsOf(
      { level, attributes: attrs, furyActive: true },
      entItem.emptyEquipment(),
    );
    ok(
      "the fury buff adds +" + CONST.FURY_ATTRIBUTE_BONUS + " em todos NV " + level,
      ["strength", "agility", "endurance", "instinct", "willpower"].every(
        (key) => buffed.sources.fury[key] === CONST.FURY_ATTRIBUTE_BONUS,
      ),
    );
  }
  const attrs = { strength: 10, agility: 10, endurance: 10, instinct: 10, willpower: 10 };
  setMoon("full");
  const underFull = stats.deriveStatsOf(
    { level: 1, attributes: attrs, form: "human" },
    entItem.emptyEquipment(),
  );
  setMoon("new");
  const underNew = stats.deriveStatsOf(
    { level: 1, attributes: attrs, form: "human" },
    entItem.emptyEquipment(),
  );
  setMoon("waning");
  for (const key of Object.keys(attrs)) {
    ok(
      "the full moon turns fury on in " + key,
      underFull.sources.fury[key] === CONST.FURY_ATTRIBUTE_BONUS &&
        underFull.sources.moon[key] === 0 &&
        underFull.totalAttributes[key] ===
          underNew.totalAttributes[key] + CONST.FURY_ATTRIBUTE_BONUS,
    );
  }
  const state = baseState({ level: 1 });
  state.equipment.claw = { itemId: "bronze-claw", enhancement: 10 };
  const item = items.findItem("bronze-claw");
  const effect = forgeRules.enhancedEffect(item, 10);
  const withGear = stats.deriveStats(state.character, state.equipment, null);
  ok(
    "garra forjada soma o efeito forjado",
    withGear.sources.equipment.strength === effect.attributes.strength,
  );
}
sec("combat");
{
  const random = seededRandom(1234);
  let fights = 0;
  for (const level of [1, 83, 170, 340, 505, 670, 840, 1000]) {
    const trained = clamp(Math.round(level * 0.55), 4, 1000);
    const set = sets.setForLevel(level);
    const lent = sets.setAttributes(set);
    const attrs = {
      strength: trained + lent.strength,
      agility: trained + lent.agility,
      endurance: trained + lent.endurance,
      instinct: trained + lent.instinct,
      willpower: trained + lent.willpower,
    };
    const derived = stats.deriveStatsOf(
      { level, attributes: attrs, form: "werewolf" },
      entItem.emptyEquipment(),
    );
    const territory =
      territoriesData.TERRITORIES.find(
        (entry) => level >= entry.minLevel && level <= entry.maxLevel,
      ) ?? territoriesData.TERRITORIES[0];
    const numbers = species.speciesNumbers(territory.species, Math.min(level, territory.maxLevel));
    const creature = {
      name: "Presa",
      health: numbers.health,
      strength: numbers.strength,
      endurance: numbers.endurance,
      agility: numbers.agility,
    };
    for (let trial = 0; trial < 300; trial += 1) {
      fights += 1;
      const petEnergy = trial % 3 === 0 ? 100 : 0;
      const outcome = combat.simulateCombat({
        characterName: "Teste",
        currentHealth: derived.maxHealth,
        stats: derived,
        creature: { ...creature },
        pet: petEnergy > 0 ? { name: "Lobo", energy: petEnergy } : null,
        random,
      });
      const told = outcome.rounds;
      ok(
        "sem NaN",
        [
          outcome.finalHealth,
          outcome.damageDealt,
          outcome.damageTaken,
          outcome.petSpent,
        ].every(Number.isFinite),
      );
      ok("final health not negative", outcome.finalHealth >= 0);
      ok(
        "veredito coerente",
        (outcome.victory ? 1 : 0) +
          (outcome.retreated ? 1 : 0) +
          (outcome.finalHealth === 0 ? 1 : 0) ===
          1,
      );
      const dealt = told
        .filter((r) => r.author !== "creature")
        .reduce((total, r) => total + r.damage, 0);
      const taken = told
        .filter((r) => r.author === "creature")
        .reduce((total, r) => total + r.damage, 0);
      ok("damage dealt = sum of rounds", dealt === outcome.damageDealt);
      ok("damage taken = sum of rounds", taken === outcome.damageTaken);
      ok("wolf spend within energy", outcome.petSpent <= petEnergy + CONST.PET_BITE_ENERGY);
      ok("wolf at home spends nothing", petEnergy > 0 || outcome.petSpent === 0);
      let lastCharacter = derived.maxHealth;
      let lastCreature = creature.health;
      let monotone = true;
      for (const round of told) {
        if (round.characterHealth > lastCharacter || round.creatureHealth > lastCreature)
          monotone = false;
        lastCharacter = round.characterHealth;
        lastCreature = round.creatureHealth;
      }
      ok("healths never rise in the narration", monotone);
    }
  }
  ok("battery ran", fights === 2400, fights);
  ok(
    "critical damage is fixed, not riding the fury",
    combat.criticalMultiplierOf() === 1.5 + CONST.CRITICAL_DAMAGE_BONUS,
  );
  const flags = {
    rounds: [],
    finalHealth: 10,
    damageDealt: 0,
    damageTaken: 0,
    petBlows: 0,
    petSpent: 0,
  };
  ok(
    "victory reads the flag",
    combat.hunterWon({ ...flags, victory: true, retreated: false }) === true,
  );
  ok(
    "a survived defeat is not a retreat",
    combat.hunterRetreated({ ...flags, victory: false, retreated: false }) === false,
  );
  ok(
    "retreat reads the flag",
    combat.hunterRetreated({ ...flags, victory: false, retreated: true }) === true,
  );
}
sec("bands and prey");
{
  const areas = territoriesData.TERRITORIES;
  ok("10 areas", areas.length === 10);
  ok("first area starts at 1", areas[0].minLevel === 1);
  ok("last area ends at 1000", areas[areas.length - 1].maxLevel === 1000);
  for (let index = 0; index < areas.length; index += 1) {
    const area = areas[index];
    ok("area " + area.id + " has 100 levels", area.maxLevel - area.minLevel + 1 === 100);
    ok("area " + area.id + " tem 10 criaturas", area.creatures.length === 10);
    if (index > 0)
      ok(
        "area " + area.id + " comes right after the previous one",
        area.minLevel === areas[index - 1].maxLevel + 1,
      );
  }

  const creatures = creaturesData.CREATURES;
  ok("100 creatures", creatures.length === 100);
  ok("unique ids", new Set(creatures.map((c) => c.id)).size === 100);

  for (const area of areas) {
    area.creatures.forEach((creatureId, slot) => {
      const creature = creaturesData.findCreature(creatureId);
      ok("creature exists " + creatureId, Boolean(creature));
      if (creature)
        ok(
          "criatura no seu bloco de 10 " + creatureId,
          creature.level === area.minLevel + slot * 10,
        );
    });
  }

  for (const creature of creatures) {
    ok(
      "integer numbers " + creature.id,
      [
        creature.health,
        creature.strength,
        creature.endurance,
        creature.agility,
        creature.experience,
        creature.minBronze,
        creature.maxBronze,
      ].every(isInt),
    );
    ok(
      "stats positivos " + creature.id,
      [
        creature.health,
        creature.strength,
        creature.endurance,
        creature.agility,
        creature.experience,
      ].every((value) => value > 0),
    );
    ok("minimum purse <= maximum " + creature.id, creature.minBronze <= creature.maxBronze);
    for (const drop of creature.drops) {
      ok("valid chance " + creature.id + "/" + drop.itemId, drop.chance > 0 && drop.chance <= 1);
      const male = items.itemIdFor(drop.itemId, "male");
      const female = items.itemIdFor(drop.itemId, "female");
      ok("drop resolves for male " + drop.itemId, Boolean(items.findItem(male)));
      ok("drop resolves for female " + drop.itemId, Boolean(items.findItem(female)));
      const dropped = items.findItem(items.itemIdFor(drop.itemId, "male"));
      ok(
        "the hunt drops no equipment " + drop.itemId,
        !entItem.EQUIPMENT_SLOTS.includes(dropped.category),
      );
    }
  }

  const ranked = [...creatures].sort((a, b) => a.level - b.level);
  let expMonotone = true;
  for (let i = 1; i < ranked.length; i += 1) {
    if (ranked[i].experience < ranked[i - 1].experience) expMonotone = false;
  }
  ok("experience grows with level", expMonotone);

  for (const definition of species.SPECIES) {
    ok("no species drops set pieces " + definition.key, definition.gearDrops.length === 0);
  }
  let previous = 0;
  let monotone = true;
  for (let level = 1; level <= 1000; level += 1) {
    const purse = species.huntPurse(level);
    if (!isInt(purse) || purse <= 0 || purse < previous) monotone = false;
    previous = purse;
  }
  ok("hunt purse is whole, positive and never falls", monotone);
  for (const level of [1, 165, 170, 340, 1000]) {
    for (const key of ["rabbit", "deer", "bear", "human", "vampire", "unicorn"]) {
      const numbers = species.speciesNumbers(key, level);
      ok(
        "presa " + key + " NV " + level + " sem NaN",
        Object.values(numbers).every(Number.isFinite),
      );
      ok(
        "presa " + key + " NV " + level + " positiva",
        Object.values(numbers).every((value) => value > 0),
      );
    }
  }
}
sec("cycle cadence");
{
  const cycles = [
    {
      name: "treino",
      draw: (random) => training.trainingSessionTicks(random),
      min: CONST.TRAINING_TICKS_MIN,
      max: CONST.TRAINING_TICKS_MAX,
    },
    {
      name: "mina",
      draw: (random) => miningRules.miningSwingTicks(random),
      min: CONST.MINING_TICKS_MIN,
      max: CONST.MINING_TICKS_MAX,
    },
  ];

  for (const cycle of cycles) {
    const drawn = new Set();
    for (let seed = 1; seed <= 400; seed += 1) {
      drawn.add(cycle.draw(seededRandom(seed)));
    }
    ok(
      cycle.name + " sorteia dentro da faixa",
      [...drawn].every(
        (ticks) => Number.isInteger(ticks) && ticks >= cycle.min && ticks <= cycle.max,
      ),
      [...drawn].sort((a, b) => a - b).join(","),
    );
    ok(
      cycle.name + " reaches both ends",
      drawn.has(cycle.min) && drawn.has(cycle.max),
    );
    ok(cycle.name + " tem faixa 3 a 7", cycle.min === 3 && cycle.max === 7);
    ok(
      cycle.name + " keeps the old 5-step average",
      (cycle.min + cycle.max) / 2 === 5,
    );
  }

  ok(
    "the mine cycle announces the range in seconds",
    CONST.MINING_CYCLE_MIN_MS === CONST.MINING_TICK_MS * (CONST.MINING_TICKS_MIN + 1) &&
      CONST.MINING_CYCLE_MAX_MS === CONST.MINING_TICK_MS * (CONST.MINING_TICKS_MAX + 1),
  );
}
sec("economy");
{
  for (const level of [1, 100, 340, 670, 1000]) {
    const trainedValue = Math.max(1, Math.round(level * 0.55));
    ok(
      "a training session is free LV " + level,
      training.trainingSessionCost(level, trainedValue) === 0,
    );
    if (trainedValue > 1) {
      ok(
        "a higher attribute takes more sessions LV " + level,
        training.trainingSessionsPerPoint(trainedValue) >=
          training.trainingSessionsPerPoint(trainedValue - 1),
      );
    }
    for (const pack of packsData.STORE_PACKS) {
      ok(
        "pacote " + pack.id + " NV " + level + " pays the same at any level",
        storeRules.packBronze(pack) === pack.bronze,
      );
    }
  }
  ok(
    "three fixed-price packs",
    json(packsData.STORE_PACKS.map((pack) => pack.bronze)) === json([20000, 80000, 200000]),
  );
  ok(
    "pack prices",
    json(packsData.STORE_PACKS.map((pack) => pack.priceCents)) === json([490, 1990, 4990]),
  );
  const FLAT_PIECE_PRICE = {
    bronze: 20000,
    silver: 25000,
    gold: 35000,
    diamond: 50000,
    lunar: 100000,
  };
  for (const definition of sets.EQUIPMENT_SETS) {
    ok(
      "piece of " + definition.key + " custa " + FLAT_PIECE_PRICE[definition.key] + " fixo",
      sets.piecePrice(definition) === FLAT_PIECE_PRICE[definition.key],
    );
    ok(
      "conjunto " + definition.key + " is worth seven pieces",
      sets.setTotalPrice(definition) ===
        entItem.EQUIPMENT_SLOTS.length * FLAT_PIECE_PRICE[definition.key],
    );
  }
  ok(
    "every piece on sale carries its set's fixed price",
    sets.buildSetItems().every((item) => item.price === FLAT_PIECE_PRICE[item.set]),
  );
  let setsClimb = true;
  for (let index = 1; index < sets.EQUIPMENT_SETS.length; index += 1) {
    if (
      sets.setTotalPrice(sets.EQUIPMENT_SETS[index]) <=
      sets.setTotalPrice(sets.EQUIPMENT_SETS[index - 1])
    ) {
      setsClimb = false;
    }
  }
  ok("set prices rise with every band", setsClimb);
  for (const level of [100, 340, 670, 1000]) {
    const value = Math.round(level * 0.55);
    const sessions = training.trainingSessionsPerPoint(value);
    ok(
      "training climbs the level's own curve, attribute " + value,
      sessions === Math.ceil(progression.experienceForLevel(value) / (12 + 7 * value)),
      sessions,
    );
    ok(
      "a training point costs no bronze LV " + level,
      training.trainingPointCost(level, value) === 0,
    );
  }
  ok("renaming the character costs flat", characterCtrl.renameCost(500) === CONST.RENAME_PRICE);
  ok("companion adoption costs flat", petRules.petPrice(500) === CONST.PET_PRICE);
  ok("renaming the companion costs flat", petRules.petRenamePrice(500) === CONST.PET_RENAME_PRICE);
}
sec("progression");
{
  for (const level of [1, 25, 500, 1000]) {
    ok(
      "required experience LV " + level,
      progression.experienceForLevel(level) === 50 * (level * level - 3 * level + 4),
    );
  }
  const character = baseState({ level: 5 }).character;
  const short = progression.applyExperience({ ...character, experience: 0 }, 10);
  ok("short gain accumulates", short.character.experience === 10 && short.levelsGained === 0);
  const crossing = progression.applyExperience(
    { ...character, experience: 0 },
    progression.experienceForLevel(5) + 50,
  );
  ok(
    "crossing the threshold climbs a level",
    crossing.levelsGained === 1 && crossing.character.level === 6,
  );
  ok("the excess becomes the next level's start", crossing.character.experience === 50);
  const leaped = progression.applyExperience(
    { ...character, experience: 0 },
    progression.experienceForLevel(5) + progression.experienceForLevel(6) + 30,
  );
  ok(
    "one fat gain climbs several levels carrying the remainder",
    leaped.levelsGained === 2 && leaped.character.level === 7 && leaped.character.experience === 30,
  );
  const atCap = progression.applyExperience({ ...character, level: 1000, experience: 0 }, 99999999);
  ok("level cap holds", atCap.character.level === 1000 && atCap.levelsGained === 0);
  ok(
    "no teto a barra fica cheia",
    atCap.character.experience === progression.experienceForLevel(1000),
  );
  const negative = progression.applyExperience({ ...character, experience: 50 }, -30);
  ok("negative gain does not steal", negative.character.experience === 50);
  const need10 = progression.progressNeeded(10);
  const need11 = progression.progressNeeded(11);
  const trainee = {
    ...character,
    attributes: { ...character.attributes, strength: 10 },
    trainingProgress: { ...character.trainingProgress, strength: need10 - 1 },
  };
  const raised = progression.applyTrainingProgress(trainee, "strength", 1);
  ok(
    "ponto sobe ao cruzar",
    raised.pointsGained === 1 && raised.character.attributes.strength === 11,
  );
  ok("progress zeroes at the point", raised.character.trainingProgress.strength === 0);
  const carry = progression.applyTrainingProgress(trainee, "strength", 11);
  ok(
    "the training overflow starts the next point",
    carry.pointsGained === 1 &&
      carry.character.attributes.strength === 11 &&
      carry.character.trainingProgress.strength === 10,
  );
  const leapt = progression.applyTrainingProgress(trainee, "strength", need11 + 6);
  ok(
    "one fat session climbs several points carrying the remainder",
    leapt.pointsGained === 2 &&
      leapt.character.attributes.strength === 12 &&
      leapt.character.trainingProgress.strength === 5,
  );
  const maxed = progression.applyTrainingProgress(
    { ...trainee, attributes: { ...trainee.attributes, strength: 1000 } },
    "strength",
    999,
  );
  ok(
    "an attribute at the cap does not pass",
    maxed.character.attributes.strength === 1000 && maxed.pointsGained === 0,
  );
  ok("cap zeroes progress", maxed.character.trainingProgress.strength === 0);
  const state = baseState({ level: 5 });
  setMoon("waxing");
  const waxing = characterCtrl.grantExperience(state, 100);
  setMoon("new");
  const plain = characterCtrl.grantExperience(state, 100);
  setMoon("waning");
  ok("waxing pays 105", waxing.granted === 105);
  ok("new moon pays 100", plain.granted === 100);
}
sec("arena");
{
  ok("band at the floor is 5 wide", json(arena.arenaBand(1)) === json({ start: 1, end: 6 }));
  ok("band at the cap touches 1000", arena.arenaBand(1000).end === 1000);
  const band500 = arena.arenaBand(500);
  ok("band at 500 is 12%", band500.start === 440 && band500.end === 560);
  const now = Date.parse("2026-01-15T18:00:00.000Z");
  const since06 = (h, m) => new Date(Date.UTC(2026, 0, 15, h, m ?? 0)).toISOString();
  const before06 = (h) => new Date(Date.UTC(2026, 0, 14, h)).toISOString();
  ok("without stamps, ten attacks", arena.arenaCharges({}, now).left === 10);
  ok("one stamp today spends one", arena.arenaCharges({ a: since06(17) }, now).left === 9);
  const spent = arena.arenaCharges(
    Object.fromEntries(Array.from({ length: 10 }, (_, i) => ["r" + i, since06(10, i)])),
    now,
  );
  ok("ten stamps zero out", spent.left === 0 && spent.returnsIn > 0);
  ok("yesterday's stamp does not count", arena.arenaCharges({ a: before06(20) }, now).left === 10);
  ok("invalid stamp does not jam", arena.arenaCooldownLeft("data-podre", now) === 0);
  ok("today's stamp rests until 06:00", arena.arenaCooldownLeft(since06(17), now) > 0);
  ok("yesterday's stamp already rested", arena.arenaCooldownLeft(before06(20), now) === 0);
  const random = seededRandom(99);
  for (const level of [1, 100, 500, 1000]) {
    const range = arena.arenaSpoilsRange(level);
    const purse = species.huntPurse(level);
    ok(
      "spoils range 1.5..3 purses LV " + level,
      range.min === Math.round(purse * 1.5) && range.max === Math.round(purse * 3),
    );
    for (const bag of [0, 10, range.max, 10000000]) {
      for (let trial = 0; trial < 500; trial += 1) {
        const spoils = arena.arenaSpoils(level, bag, random);
        const shareCap = Math.round((bag * 25) / 100);
        if (!(isInt(spoils) && spoils >= 0 && spoils <= range.max && spoils <= shareCap)) {
          ok("spoils within limits LV " + level + " purse " + bag, false, spoils);
          break;
        }
      }
    }
    ok("empty purse pays nothing LV " + level, arena.arenaSpoils(level, 0, random) === 0);
  }
  const inBand = baseState({ level: 5 });
  const rival = benchHunter("pit-near", 5);
  const pit = [rival, benchHunter("pit-far", 500)];
  ok(
    "outside the band is refused",
    arenaCtrl.resolveArena(inBand, pit, "pit-far", random).ok === false,
  );
  ok(
    "challenging yourself is refused",
    arenaCtrl.resolveArena(inBand, [...pit, { ...rival, id: inBand.character.id }], inBand.character.id, random).ok === false,
  );
  const cooling = { ...inBand, arenaDuels: { [rival.id]: new Date().toISOString() } };
  ok(
    "rest until 06:00 is refused",
    arenaCtrl.resolveArena(cooling, pit, rival.id, random).ok === false,
  );
  const drained = {
    ...inBand,
    arenaDuels: Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => ["r" + i, new Date().toISOString()]),
    ),
  };
  ok(
    "without the day's attacks it is refused",
    arenaCtrl.resolveArena(drained, pit, rival.id, random).ok === false,
  );
  const bleeding = { ...inBand, character: { ...inBand.character, health: 1 } };
  ok(
    "health on the floor is refused",
    arenaCtrl.resolveArena(bleeding, pit, rival.id, random).ok === false,
  );
  const wounded = {
    ...inBand,
    character: { ...inBand.character, health: inBand.character.health - 1 },
  };
  ok(
    "incomplete health is refused",
    arenaCtrl.resolveArena(wounded, pit, rival.id, random).ok === false,
  );
  const duel = arenaCtrl.resolveArena(inBand, pit, rival.id, seededRandom(7));
  ok("valid duel resolves", duel.ok === true);
  if (duel.ok) {
    const landed = arenaCtrl.landArena(inBand, duel.data, 0);
    const before = inBand.character;
    const after = landed.state.character;
    ok(
      "bronze changes exactly the spoils",
      after.bronze === Math.max(0, before.bronze + duel.data.spoils),
    );
    ok("rival's stamp is recorded", typeof landed.state.arenaDuels[rival.id] === "string");
    ok(
      "contador certo",
      duel.data.combat.victory
        ? after.arenaWins === before.arenaWins + 1
        : duel.data.combat.retreated
          ? after.arenaWins === before.arenaWins && after.arenaLosses === before.arenaLosses
          : after.arenaLosses === before.arenaLosses + 1,
    );
    ok("a draw moves no bronze", duel.data.combat.retreated ? duel.data.spoils === 0 : true);
    ok(
      "experience does not come from the pit",
      after.experience === before.experience && after.level === before.level,
    );

    const beaten = {
      ...duel.data,
      combat: { ...duel.data.combat, victory: false, retreated: false },
      spoils: 0,
    };
    const humbled = arenaCtrl.landArena(inBand, beaten, 0);
    ok(
      "a defeat counts one loss in the pit",
      humbled.state.character.arenaLosses === inBand.character.arenaLosses + 1,
    );
  }
  const allyPet = {
    id: "pet",
    name: "Lobo",
    gender: "male",
    energy: 100,
    active: true,
    level: 1,
    trainingProgress: 0,
    adoptedAt: new Date().toISOString(),
  };
  const packState = { ...inBand, pet: allyPet };
  const rivalWithWolf = {
    ...rival,
    pet: { name: "Brasa", gender: "female", energy: 100, active: true },
  };
  const packDuel = arenaCtrl.resolveArena(
    packState,
    [rivalWithWolf, pit[1]],
    rival.id,
    seededRandom(11),
  );
  ok("challenger's companion bites in the pit", packDuel.ok && packDuel.data.combat.petSpent > 0);
  ok(
    "the rival's companion bites in the pit",
    packDuel.ok && packDuel.data.combat.rounds.some((round) => round.text.includes("Brasa")),
  );
  if (packDuel.ok) {
    const packLanded = arenaCtrl.landArena(packState, packDuel.data, 0);
    ok(
      "the companion's breath lands in the duel",
      packLanded.state.pet.energy ===
        clamp(100 - packDuel.data.combat.petSpent, 0, petRules.petMaxEnergy(1)),
    );
  }
  const breathless = {
    ...packState,
    pet: { ...allyPet, energy: CONST.PET_ENERGY_PER_HUNT + CONST.PET_ENERGY_PER_BLOW - 1 },
  };
  const soloDuel = arenaCtrl.resolveArena(breathless, pit, rival.id, seededRandom(12));
  ok(
    "a breathless wolf stays out of the pit",
    soloDuel.ok && soloDuel.data.combat.petSpent === 0 && soloDuel.data.combat.petBlows === 0,
  );
  const pitMemory = [
    {
      id: "d1",
      challengerId: "me",
      challengerName: "Eu",
      rivalId: "them",
      rivalName: "Ele",
      outcome: "victory",
      spoils: 10,
      at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "d2",
      challengerId: "them",
      challengerName: "Ele",
      rivalId: "me",
      rivalName: "Eu",
      outcome: "victory",
      spoils: 5,
      at: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "d3",
      challengerId: "them",
      challengerName: "Ele",
      rivalId: "me",
      rivalName: "Eu",
      outcome: "draw",
      spoils: 0,
      at: "2026-01-03T00:00:00.000Z",
    },
  ];
  const told = arenaCtrl.describeArenaHistory(pitMemory, "me");
  ok(
    "ataque meu fala do meu ponto de vista",
    told[0].mine === true && told[0].outcome === "victory" && told[0].rivalName === "Ele",
  );
  ok(
    "ataque recebido inverte o resultado",
    told[1].mine === false && told[1].outcome === "defeat" && told[1].rivalName === "Ele",
  );
  ok("a draw is a draw on both sides", told[2].outcome === "draw");
}
sec("hunt");
{
  const random = seededRandom(2024);
  const state = baseState({ level: 170 });
  state.equipment.claw = { itemId: "silver-claw", enhancement: 0 };
  const weak = { ...state, character: { ...state.character, health: 0 } };
  ok("zeroed health does not hunt", huntCtrl.resolveHunt(weak, "dew-woods", random).ok === false);
  const bleeding = { ...state, character: { ...state.character, health: 1 } };
  ok("hunts at 1 health", huntCtrl.resolveHunt(bleeding, "dew-woods", random).ok === true);
  ok(
    "every area is open: the band became a suggestion",
    huntCtrl.resolveHunt(state, "white-clearing", random).ok === true,
  );
  ok("unknown territory refuses", huntCtrl.resolveHunt(state, "nada", random).ok === false);
  const resolved = huntCtrl.resolveHunt(state, "dew-woods", random);
  ok("valid hunt resolves", resolved.ok === true);
  const picked = huntCtrl.resolveHunt(state, "dew-woods", random, "young-bear");
  ok(
    "the hunt faces the creature chosen by id",
    picked.ok === true && picked.data.creature.id === "young-bear",
  );
  const firstPrey = huntCtrl.resolveHunt(
    state,
    "village-field",
    seededRandom(11),
    "field-rabbit",
  );
  const nextPrey = huntCtrl.resolveHunt(state, "village-field", seededRandom(12), "thief-fox");
  ok(
    "the next hunt honors the new id, not the previous lap's",
    firstPrey.ok &&
      nextPrey.ok &&
      firstPrey.data.creature.id === "field-rabbit" &&
      nextPrey.data.creature.id === "thief-fox",
  );
  const stray = huntCtrl.resolveHunt(state, "village-field", seededRandom(13), "young-bear");
  ok(
    "another area's id falls to the trail's prey, not the outsider",
    stray.ok === true && stray.data.creature.id !== "young-bear",
  );
  const rabbit = { id: "field-rabbit", name: "Coelho-do-campo", health: 40 };
  const fox = { id: "thief-fox", name: "Raposa-ladra", health: 55 };
  const fallen = {
    victory: true,
    retreated: false,
    rounds: [],
    finalHealth: 10,
    damageDealt: 0,
    damageTaken: 0,
    petBlows: 0,
    petSpent: 0,
  };
  const lastRabbit = {
    creatureId: rabbit.id,
    name: rabbit.name,
    health: rabbit.health,
    combat: fallen,
  };
  const kept = huntPresenter.huntPreyView({
    replaying: false,
    filling: false,
    pending: null,
    lastFoe: lastRabbit,
    selected: rabbit,
  });
  ok(
    "without a switch the card keeps the same creature on the ground",
    kept.foe && kept.foe.id === rabbit.id && kept.combat === fallen,
  );
  const swapped = huntPresenter.huntPreyView({
    replaying: false,
    filling: false,
    pending: null,
    lastFoe: lastRabbit,
    selected: fox,
  });
  ok(
    "trocar a presa no intervalo mostra o bicho novo inteiro",
    swapped.foe && swapped.foe.id === fox.id && swapped.combat === null,
  );
  const midFight = huntPresenter.huntPreyView({
    replaying: true,
    filling: false,
    pending: { creature: rabbit, combat: fallen },
    lastFoe: lastRabbit,
    selected: fox,
  });
  ok("the ongoing fight does not swap creatures", midFight.foe && midFight.foe.id === rabbit.id);
  if (resolved.ok) {
    const beaten = {
      ...resolved.data,
      combat: { ...resolved.data.combat, victory: false, retreated: false },
      bronze: 0,
      drops: [],
    };
    const humbledHunt = huntCtrl.landHunt(state, beaten, 0);
    ok(
      "a hunt defeat counts one loss",
      humbledHunt.state.character.losses === state.character.losses + 1,
    );

    const landed = huntCtrl.landHunt(state, resolved.data, 0);
    const before = state.character;
    const after = landed.state.character;
    const derived = stats.deriveStats(before, state.equipment, state.pet);
    ok("bronze adds the haul", after.bronze === before.bronze + resolved.data.bronze);
    ok("hunts count", after.hunts === before.hunts + 1);
    ok(
      "vida desce o que a luta tirou",
      after.health ===
        clamp(Math.max(1, before.health - resolved.data.healthLost), 0, derived.maxHealth),
    );
    ok(
      "blood already spilled is not charged twice",
      huntCtrl.landHunt(state, resolved.data, resolved.data.healthLost).state.character.health ===
        before.health,
    );
    for (const drop of resolved.data.drops) {
      ok(
        "withdrawal in the inventory " + drop.itemId,
        inventoryCtrl.countInInventory(landed.state.inventory, drop.itemId) >= drop.quantity,
      );
    }
  }
  const inGap = baseState({ level: 167, form: "werewolf" });
  const gapView = huntCtrl
    .listTerritories(inGap)
    .find((entry) => entry.territory.id === "village-field");
  const topOfArea1 = creaturesData.findCreature("forest-lynx");
  ok("the prey is the strongest unlocked variant", gapView.prey.name === topOfArea1.name);
  ok("the fixed prey does not scale with hunter level", gapView.prey.health === topOfArea1.health);
  const withPet = baseState({ level: 10, form: "werewolf" });
  withPet.pet = {
    id: "pet",
    name: "Lobo",
    gender: "male",
    energy: 100,
    active: true,
    level: 1,
    trainingProgress: 0,
    adoptedAt: new Date().toISOString(),
  };
  const petHunt = huntCtrl.resolveHunt(withPet, "village-field", seededRandom(5));
  if (petHunt.ok && petHunt.data.combat.petSpent > 0) {
    const landed = huntCtrl.landHunt(withPet, petHunt.data, 0);
    ok(
      "breath drops in one subtraction",
      landed.state.pet.energy ===
        clamp(100 - petHunt.data.combat.petSpent, 0, petRules.petMaxEnergy(1)),
    );
    ok(
      "the hunting wolf does not learn, only trains",
      landed.state.pet.trainingProgress === 0 && landed.state.pet.level === 1,
    );
  }
  const shortWind = {
    ...withPet,
    pet: { ...withPet.pet, energy: CONST.PET_ENERGY_PER_HUNT + CONST.PET_ENERGY_PER_BLOW - 1 },
  };
  const shortHunt = huntCtrl.resolveHunt(shortWind, "village-field", seededRandom(6));
  ok(
    "a breathless wolf stays out of the hunt",
    shortHunt.ok && shortHunt.data.combat.petSpent === 0 && shortHunt.data.combat.petBlows === 0,
  );
  if (shortHunt.ok) {
    const shortLanded = huntCtrl.landHunt(shortWind, shortHunt.data, 0);
    ok(
      "a wolf out of the fight does not learn",
      shortLanded.state.pet.trainingProgress === 0 && shortLanded.state.pet.level === 1,
    );
  }
  const oneMore = {
    ...withPet,
    pet: {
      ...withPet.pet,
      energy: CONST.PET_ENERGY_PER_HUNT + CONST.PET_ENERGY_PER_BLOW,
    },
  };
  const firstHunt = huntCtrl.resolveHunt(oneMore, "village-field", seededRandom(9));
  ok("wolf with just enough energy joins the fight", firstHunt.ok && firstHunt.data.combat.petSpent > 0);
  if (firstHunt.ok) {
    const afterOne = huntCtrl.landHunt(oneMore, firstHunt.data, 0);
    ok(
      "the hunt drains the wolf's breath",
      afterOne.state.pet.energy < CONST.PET_ENERGY_PER_HUNT + CONST.PET_ENERGY_PER_BLOW,
    );
    const rested = { ...afterOne.state, character: { ...afterOne.state.character, health: 100 } };
    const nextHunt = huntCtrl.resolveHunt(rested, "village-field", seededRandom(10));
    ok(
      "on the restart the drained wolf stays out",
      nextHunt.ok && nextHunt.data.combat.petSpent === 0 && nextHunt.data.combat.petBlows === 0,
    );
  }
  const homePet = { ...withPet, pet: { ...withPet.pet, active: false } };
  const homeHunt = huntCtrl.resolveHunt(homePet, "village-field", seededRandom(5));
  if (homeHunt.ok) {
    const landed = huntCtrl.landHunt(homePet, homeHunt.data, 0);
    ok(
      "a wolf at home neither spends nor learns",
      landed.state.pet.energy === 100 && (landed.state.pet.trainingProgress ?? 0) === 0,
    );
  }
}
sec("training");
{
  const state = baseState({ level: 100 });
  const broke = { ...state, character: { ...state.character, bronze: 0 } };
  ok("without bronze still trains", trainingCtrl.train(broke, "trunk-punches").ok === true);
  const wounded = { ...state, character: { ...state.character, health: 1 } };
  ok("on the floor still trains", trainingCtrl.train(wounded, "trunk-punches").ok === true);
  ok("unknown exercise refuses", trainingCtrl.train(state, "nada").ok === false);
  const maxed = {
    ...state,
    character: {
      ...state.character,
      attributes: { ...state.character.attributes, strength: 1000 },
    },
  };
  ok("attribute at the cap refuses", trainingCtrl.train(maxed, "trunk-punches").ok === false);
  const session = trainingCtrl.train(state, "trunk-punches");
  ok("valid session trains", session.ok === true);
  if (session.ok) {
    ok(
      "a session charges no bronze",
      session.state.character.bronze === state.character.bronze,
    );
    const gained =
      session.state.character.trainingProgress.strength > 0 ||
      session.state.character.attributes.strength > state.character.attributes.strength;
    ok("session yields progress", gained);
    const second = trainingCtrl.train(session.state, "trunk-punches");
    ok(
      "the next session is also free",
      second.ok && second.state.character.bronze === session.state.character.bronze,
    );
  }
  ok(
    "each exercise trains one attribute",
    json(exercisesData.EXERCISES.map((exercise) => exercise.attribute).sort()) ===
      json(["agility", "endurance", "instinct", "strength", "willpower"]),
  );
  const withPet = {
    ...state,
    pet: {
      id: "p",
      name: "Lobo",
      gender: "male",
      energy: 50,
      active: true,
      level: 1,
      trainingProgress: 0,
      adoptedAt: new Date().toISOString(),
    },
  };
  const petSession = petCtrl.trainPet(withPet);
  ok("wolf session works", petSession.ok === true);
  if (petSession.ok) {
    const cost = petRules.petTrainingSessionCost(1, 100);
    ok(
      "a wolf session charges on the spot",
      petSession.state.character.bronze === withPet.character.bronze - cost,
    );
    ok(
      "lobo progride",
      (petSession.state.pet.trainingProgress ?? 0) > 0 || petSession.state.pet.level > 1,
    );
  }
  const petMaxed = { ...withPet, pet: { ...withPet.pet, level: 1000 } };
  ok("wolf at the cap refuses", petCtrl.trainPet(petMaxed).ok === false);
}
sec("companion");
{
  ok("base energy", petRules.petMaxEnergy(1) === 100);
  ok("energy grows 4 per level", petRules.petMaxEnergy(100) === 100 + 99 * 4);
  const growing = {
    id: "p",
    name: "L",
    gender: "male",
    energy: 0,
    active: false,
    level: 5,
    adoptedAt: "",
    trainingProgress: 100,
  };
  const grown = petRules.growPet(growing, 30);
  ok(
    "the wolf training overflow starts the next level",
    grown.leveled && grown.pet.level === 6 && grown.pet.trainingProgress === 10,
  );
  ok(
    "the bonus starts at 5",
    json(petRules.petLevelBonus(1)) ===
      json({ strength: 5, agility: 5, endurance: 0, instinct: 5, willpower: 0 }),
  );
  ok("bonus adds 1 per level", petRules.petLevelBonus(10).strength === 14);
  const sleeping = { id: "p", name: "L", gender: "male", energy: 0, active: true, adoptedAt: "" };
  ok(
    "out of breath lends nothing",
    json(petRules.petBonus(sleeping)) ===
      json({ strength: 0, agility: 0, endurance: 0, instinct: 0, willpower: 0 }),
  );
  const home = { ...sleeping, energy: 50, active: false };
  ok("at home lends nothing", petRules.petBonus(home).strength === 0);
  const pet = {
    id: "p",
    name: "L",
    gender: "male",
    energy: 0,
    active: false,
    level: 5,
    trainingProgress: 0,
    adoptedAt: "",
  };
  let resting = pet;
  let ticks = 0;
  while (!petRules.isPetWhole(resting) && ticks < 15) {
    resting = petRules.restPet(resting, petRules.petRestStep(resting));
    ticks += 1;
  }
  ok("rest fills in 10 minutes", ticks === 10, ticks);
  ok(
    "spending past the breath locks at zero",
    petRules.spendPetEnergy({ ...pet, energy: 3 }, 50).energy === 0,
  );
  ok(
    "food past the cap locks at the cap",
    petRules.restPet({ ...pet, energy: 100 }, 9999).energy === petRules.petMaxEnergy(5),
  );
  const state = baseState({ level: 10 });
  state.pet = { ...pet, energy: 10, active: true };
  state.inventory = [...state.inventory, { itemId: "pet-ration", quantity: 2, enhancement: 0 }];
  const fed = petCtrl.feedPet(state, "pet-ration");
  ok(
    "a ration gives back a quarter of the cap",
    fed.ok && fed.state.pet.energy === 10 + Math.round(petRules.petMaxEnergy(5) * 0.25),
  );
  ok(
    "the ration leaves the bag",
    fed.ok && inventoryCtrl.countInInventory(fed.state.inventory, "pet-ration") === 1,
  );
  const whole = { ...state, pet: { ...state.pet, energy: petRules.petMaxEnergy(5) } };
  ok("whole wolf refuses food", petCtrl.feedPet(whole, "pet-ration").ok === false);
  ok("consuming a ration lands on the companion", inventoryCtrl.consumeItem(state, "pet-ration").ok === true);
  const active = { ...state };
  ok("rest demands the wolf at home", petCtrl.restPetTick(active).ok === false);
  const kennel = petCtrl.setPetActive(active, false);
  ok("sending home works", kennel.ok === true);
  if (kennel.ok) {
    const tick = petCtrl.restPetTick(kennel.state);
    ok("rest tick pays", tick.ok && tick.state.pet.energy > 10);
  }
  const young = petCtrl.adoptPet(
    { ...baseState({ level: CONST.PET_MIN_LEVEL - 1 }), pet: null },
    "female",
    "Neve",
  );
  ok("adoption refuses before the minimum LV", young.ok === false);
  const adoptLevel = CONST.PET_MIN_LEVEL;
  const adopt = petCtrl.adoptPet(
    { ...baseState({ level: adoptLevel }), pet: null },
    "female",
    "Neve",
  );
  ok(
    "adoption charges a fixed price",
    adopt.ok &&
      adopt.state.character.bronze ===
        baseState({ level: adoptLevel }).character.bronze - CONST.PET_PRICE,
  );
  ok("second adoption refuses", petCtrl.adoptPet(adopt.state, "male", "Outro").ok === false);
  const released = petCtrl.releasePet(adopt.state);
  ok(
    "releasing returns no bronze",
    released.ok && released.state.character.bronze === adopt.state.character.bronze,
  );
}
sec("forge and mine");
{
  let forgeCostOk = true;
  for (let level = 1; level <= 1000; level += 1) {
    if (forgeRules.enhancementCost(level) !== progression.experienceForLevel(level)) {
      forgeCostOk = false;
      break;
    }
  }
  ok("forge cost is the experience curve itself (49,850,200 at the cap)", forgeCostOk);
  const claw = items.findItem("lunar-claw");
  const forged = forgeRules.enhancedEffect(claw, 100);
  const base = claw.effect.attributes.strength;
  ok(
    "the forge multiplies the piece (0.3% per level, fractional, unrounded)",
    Math.abs(forged.attributes.strength - base * (1 + 0.003 * 100)) < 1e-9,
  );
  ok("forge zero returns the pure effect", forgeRules.enhancedEffect(claw, 0) === claw.effect);
  const state = baseState({ level: 1 });
  const fragmentStock = forgeRules.enhancementCost(5) + 100;
  state.inventory = [
    ...state.inventory,
    { itemId: "bronze-claw", quantity: 1, enhancement: 4 },
    { itemId: "bronze-fragment", quantity: fragmentStock, enhancement: 0 },
  ];
  const strikeFee = forgeRules.forgeBronzeCost(state.character.level, 4);
  const enhanced = forgeCtrl.enhance(state, "bronze-claw", 4, () => 0);
  ok(
    "a landed strike climbs one level",
    enhanced.ok && inventoryCtrl.countInInventory(enhanced.state.inventory, "bronze-claw", 5) === 1,
  );
  ok(
    "a landed strike consumes the old copy",
    enhanced.ok && inventoryCtrl.countInInventory(enhanced.state.inventory, "bronze-claw", 4) === 0,
  );
  ok("successful strike answers raised", enhanced.ok && enhanced.data.raised === true);
  ok(
    "forja consome o fragmento do conjunto",
    enhanced.ok &&
      inventoryCtrl.countInInventory(enhanced.state.inventory, "bronze-fragment") ===
        fragmentStock - forgeRules.enhancementCost(5),
  );
  ok(
    "martelada cobra bronze",
    enhanced.ok && enhanced.state.character.bronze === state.character.bronze - strikeFee,
  );
  const missed = forgeCtrl.enhance(state, "bronze-claw", 4, () => 0.99);
  ok(
    "a missed strike keeps the level",
    missed.ok &&
      inventoryCtrl.countInInventory(missed.state.inventory, "bronze-claw", 4) === 1 &&
      missed.data.raised === false,
  );
  ok(
    "martelada falha ainda consome fragmentos",
    missed.ok &&
      inventoryCtrl.countInInventory(missed.state.inventory, "bronze-fragment") ===
        fragmentStock - forgeRules.enhancementCost(5),
  );
  ok(
    "a missed strike also pays the smith",
    missed.ok && missed.state.character.bronze === state.character.bronze - strikeFee,
  );
  const broke = { ...state, character: { ...state.character, bronze: strikeFee - 1 } };
  ok(
    "sem bronze a bigorna recusa",
    forgeCtrl.enhance(broke, "bronze-claw", 4, () => 0).ok === false,
  );
  ok(
    "the strike gets pricier with the piece and the band",
    forgeRules.forgeBronzeCost(1, 5) > forgeRules.forgeBronzeCost(1, 4) &&
      forgeRules.forgeBronzeCost(500, 4) > forgeRules.forgeBronzeCost(1, 4),
  );
  const wrongFragments = {
    ...state,
    inventory: [
      { itemId: "bronze-claw", quantity: 1, enhancement: 4 },
      { itemId: "silver-fragment", quantity: 99, enhancement: 0 },
    ],
  };
  ok(
    "another set's fragment does not serve",
    forgeCtrl.enhance(wrongFragments, "bronze-claw", 4).ok === false,
  );
  ok(
    "a copy outside the bag does not forge",
    forgeCtrl.enhance(state, "bronze-claw", 7).ok === false,
  );
  ok(
    "the anvil lists the bag copy",
    forgeCtrl
      .listForge(state)
      .some((piece) => piece.item.id === "bronze-claw" && piece.level === 4),
  );
  if (enhanced.ok) {
    const on = inventoryCtrl.equipItem(enhanced.state, "bronze-claw", 5);
    ok(
      "equipar carrega a forja",
      on.ok && on.state.equipment.claw && on.state.equipment.claw.enhancement === 5,
    );
  }
  const ores = oresData.ORES;
  for (let index = 1; index < ores.length; index += 1) {
    ok(
      "escada da mina sobe " + ores[index].id,
      ores[index].requiredLevel > ores[index - 1].requiredLevel,
    );
  }
  ok(
    "the mining cap is the character's cap",
    oresData.MINING_MAX_LEVEL === CONST.MAX_CHARACTER_LEVEL,
  );
  ok(
    "a vein asks for the band's mining level",
    ores.map((ore) => ore.requiredLevel).join(",") === "1,201,401,601,801",
  );
  for (const ore of ores) {
    ok("vein " + ore.id + " tem fragmento real", Boolean(items.findItem(ore.fragmentId)));
  }
  const miner = { ...baseState({ level: 1 }), mining: { level: 1, progress: 0 } };
  ok("deep vein refuses", forgeCtrl.mine(miner, "lunar-vein", seededRandom(1)).ok === false);
  const swing = forgeCtrl.mine(miner, "bronze-vein", seededRandom(1));
  ok(
    "golpe rende fragmentos",
    swing.ok && inventoryCtrl.countInInventory(swing.state.inventory, "bronze-fragment") >= 1,
  );
  ok("swing climbs the ladder", swing.ok && swing.state.mining.progress === miningRules.miningEffort(1));
  const YIELD_TABLE = {
    "bronze-vein": [1, 3],
    "silver-vein": [3, 6],
    "gold-vein": [6, 9],
    "diamond-vein": [9, 12],
    "lunar-vein": [12, 15],
  };
  for (const ore of ores) {
    const [min, max] = YIELD_TABLE[ore.id];
    ok(
      "vein " + ore.id + " rende de " + min + " a " + max + " per mining",
      ore.minYield === min && ore.maxYield === max,
    );
  }
  const deep = { ...miner, mining: { level: 400, progress: 0 } };
  let deepInRange = true;
  for (let seed = 1; seed <= 40; seed += 1) {
    const deepSwing = forgeCtrl.mine(deep, "bronze-vein", seededRandom(seed));
    const got = inventoryCtrl.countInInventory(deepSwing.state.inventory, "bronze-fragment");
    if (!deepSwing.ok || got < 1 || got > 3) deepInRange = false;
  }
  ok("mining level does not multiply the vein's yield", deepInRange);
  const noon = 1_700_000_000_000;
  const period = miningRules.miningPeriodStart(noon);
  const fresh = { ...baseState({ level: 1 }), mining: { level: 1, progress: 0, count: 0 } };
  const firstSwing = forgeCtrl.mine(fresh, "bronze-vein", seededRandom(1), noon);
  ok(
    "one mining counts one of the quota",
    firstSwing.ok && firstSwing.state.mining.count === 1,
  );
  ok(
    "the reset is the same instant for everyone: 09:00 UTC (06:00 São Paulo)",
    new Date(period).getUTCHours() === CONST.MINING_RESET_HOUR_UTC && noon - period < 24 * 60 * 60 * 1000,
  );
  ok(
    "the next reset falls within a day",
    miningRules.miningResetsInMs(noon) > 0 &&
      miningRules.miningResetsInMs(noon) <= 24 * 60 * 60 * 1000,
  );
  const spent = {
    ...fresh,
    mining: {
      level: 1,
      progress: 0,
      windowStart: new Date(period).toISOString(),
      count: CONST.MINING_DAILY_MININGS,
    },
  };
  ok(
    "gasta a cota do dia, a veia recusa",
    forgeCtrl.mine(spent, "bronze-vein", seededRandom(2), noon).ok === false,
  );
  const yesterday = {
    ...spent,
    mining: { ...spent.mining, windowStart: new Date(period - 1000).toISOString() },
  };
  const reopened = forgeCtrl.mine(yesterday, "bronze-vein", seededRandom(3), noon);
  ok(
    "past 06:00, the new period zeroes the quota",
    reopened.ok && reopened.state.mining.count === 1,
  );
  const preserved = miningRules.applyMiningProgress(
    { level: 1, progress: 0, windowStart: "2020-01-01T00:00:00.000Z", count: 42 },
    10,
  );
  ok(
    "progress keeps the day's period and quota",
    preserved.mining.count === 42 &&
      preserved.mining.windowStart === "2020-01-01T00:00:00.000Z",
  );
  ok(
    "the listing exposes the day's remaining quota",
    forgeCtrl.listMining(fresh, noon).dailyRemaining === CONST.MINING_DAILY_MININGS &&
      forgeCtrl.listMining(spent, noon).dailyExhausted === true,
  );
}
sec("bazaar");
{
  ok("house fee is 10%", bazaarRules.feeOf(1000) === 100 && bazaarRules.sellerNet(1000) === 900);
  ok("minimum withdrawal is R$ 100", bazaarRules.MIN_WITHDRAW_CENTS === 10000);
  ok("new wallet has R$ 10", factory.createRun("Novo", "male").wallet.cents === 1000);
  const fragment = items.findItem("bronze-fragment");
  const plain = items.findItem("bronze-claw");
  const material = items.findItem("wolf-pelt");
  ok("fragment enters the bazaar", bazaarRules.checkTrade(fragment, 0).tradable === true);
  ok("forged piece enters", bazaarRules.checkTrade(plain, 1).tradable === true);
  ok("plain market piece does not enter", bazaarRules.checkTrade(plain, 0).tradable === false);
  ok("hunt material does not enter", bazaarRules.checkTrade(material, 0).tradable === false);
  const state = baseState({ level: 1 });
  state.inventory = [
    ...state.inventory,
    { itemId: "bronze-claw", quantity: 1, enhancement: 2 },
    { itemId: "bronze-fragment", quantity: 30, enhancement: 0 },
  ];
  const tooCheap = bazaarCtrl.announceListing(state, "bronze-fragment", 5, 50);
  ok("listing below the minimum refuses", tooCheap.ok === false);
  const tooMany = bazaarCtrl.announceListing(state, "bronze-fragment", 99, 500);
  ok("listing beyond the bag refuses", tooMany.ok === false);
  const announced = bazaarCtrl.announceListing(state, "bronze-fragment", 10, 500);
  ok(
    "a listing takes from the bag",
    announced.ok &&
      inventoryCtrl.countInInventory(announced.state.inventory, "bronze-fragment") === 20,
  );
  ok(
    "a listing charges the fee in bronze",
    announced.ok &&
      announced.state.character.bronze ===
        state.character.bronze - bazaarRules.bazaarListingFee(state.character.level),
  );
  const freshListing = {
    id: "bz-1",
    sellerId: "x",
    sellerName: "X",
    itemId: "bronze-fragment",
    enhancement: 0,
    quantity: 5,
    priceCents: 500,
    announcedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  };
  const staleListing = {
    ...freshListing,
    id: "bz-2",
    announcedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  };
  ok(
    "a listing expires in seven days",
    entBazaar.isListingExpired(staleListing) === true &&
      entBazaar.isListingExpired(freshListing) === false,
  );
  const shelf = bazaarCtrl.listBoard(state, [freshListing, staleListing]);
  ok(
    "vencido some da vitrine dos outros",
    shelf.some((entry) => entry.listing.id === "bz-1") &&
      shelf.every((entry) => entry.listing.id !== "bz-2"),
  );
  if (announced.ok) {
    const mine = announced.state.bazaarListings[0];
    const myShelf = bazaarCtrl.listBoard(
      {
        ...announced.state,
        bazaarListings: [
          { ...mine, announcedAt: new Date(Date.now() - 8 * 86400000).toISOString() },
        ],
      },
      [],
    );
    ok(
      "the owner still sees their expired listing",
      myShelf.length === 1 && myShelf[0].expired === true,
    );
    ok(
      "comprar de si mesmo recusa",
      bazaarCtrl.purchaseListing(announced.state, mine, 1).ok === false,
    );
    const cancelled = bazaarCtrl.cancelListing(announced.state, mine.id);
    ok(
      "cancelar devolve tudo",
      cancelled.ok &&
        inventoryCtrl.countInInventory(cancelled.state.inventory, "bronze-fragment") === 30,
    );
  }
  const goldClaw = items.findItem("gold-claw");
  const offer = {
    id: "listing_bench",
    sellerId: "chr_bench_seller",
    sellerName: "Vendedor",
    itemId: "gold-claw",
    enhancement: 3,
    quantity: 2,
    priceCents: 500,
    announcedAt: new Date().toISOString(),
  };
  const rich = baseState({ level: 1000 });
  const bought = bazaarCtrl.purchaseListing(rich, offer, 1);
  ok(
    "compra entrega sem tocar o Alforje",
    bought.ok &&
      bought.state.wallet.cents === rich.wallet.cents &&
      inventoryCtrl.countInInventory(bought.state.inventory, "gold-claw") === 1,
  );
  ok("purchase remembers the listing", bought.ok && bought.state.bazaarPurchases[offer.id] === 1);
  ok(
    "a higher forge travels with the piece",
    bought.ok &&
      inventoryCtrl.countInInventory(bought.state.inventory, "gold-claw", offer.enhancement) === 1,
  );
  ok(
    "a purchase records the bazaar badge",
    bought.ok && bought.state.bazaarFinds.includes("gold-claw"),
  );
  ok("beyond the listing refuses", bazaarCtrl.purchaseListing(rich, offer, 3).ok === false);
  const low = baseState({ level: 1 });
  ok(
    "a purchase respects the level",
    goldClaw.minLevel > 1 && bazaarCtrl.purchaseListing(low, offer, 1).ok === false,
  );
  const poor = { ...state, wallet: { cents: 9999 } };
  ok(
    "saque abaixo do piso recusa",
    bazaarCtrl.requestWithdraw(poor, "chave-pix-valida").ok === false,
  );
  const flush = { ...state, wallet: { cents: 10000 } };
  const withdrawn = bazaarCtrl.requestWithdraw(flush, "chave-pix-valida");
  ok("withdrawal empties the saddlebag", withdrawn.ok && withdrawn.state.wallet.cents === 0);
  ok("short key refuses", bazaarCtrl.requestWithdraw(flush, "abc").ok === false);
}
sec("moon");
{
  const month = moon.SYNODIC_MONTH_DAYS;
  const seen = [];
  for (let age = 0; age < month; age += 0.01) {
    const key = moon.phaseFromAge(age).key;
    if (seen[seen.length - 1] !== key) seen.push(key);
  }
  ok("the phases turn in order", json(seen) === json(["new", "waxing", "full", "waning", "new"]));
  const window = month / 8;
  ok(
    "janela da cheia tem ~3,7 dias",
    moon.phaseFromAge(month / 2 - window / 2 + 0.01).key === "full" &&
      moon.phaseFromAge(month / 2 + window / 2 - 0.01).key === "full" &&
      moon.phaseFromAge(month / 2 + window / 2 + 0.01).key === "waning",
  );
  ok("negative age does not break", Number.isFinite(moon.computeMoonLocally(0).age));
  setMoon("full");
  ok("full moon pays no experience", moon.withMoonBonus(100) === 100);
  ok("full moon is active", moon.isFullMoon());
  setMoon("waxing");
  ok("waxing pays 5%", moon.withMoonBonus(100) === 105);
  ok("waxing is not full moon", !moon.isFullMoon());
  ok("waxing pays 5% in training", moon.withMoonTrainingBonus(100) === 105);
  ok("waxing pays nothing in the mine", moon.withMoonMiningBonus(100) === 100);
  setMoon("new");
  ok("new moon pays 5% in the mine", moon.withMoonMiningBonus(100) === 105);
  ok(
    "the new moon pays neither hunt nor training",
    moon.withMoonBonus(100) === 100 && moon.withMoonTrainingBonus(100) === 100,
  );
  setMoon("waning");
  ok(
    "the waning moon pays nothing",
    moon.withMoonBonus(100) === 100 &&
      moon.withMoonTrainingBonus(100) === 100 &&
      moon.withMoonMiningBonus(100) === 100,
  );
}
sec("willpower stretches the fury");
{
  ok("without Willpower the flask matches the label", moon.furyDurationMs(5, 0) === 5 * 60_000);
  ok("negative Willpower does not shorten", moon.furyDurationMs(5, -50) === 5 * 60_000);

  let previous = moon.furyDurationMs(5, 0);
  let strictly = true;
  for (let willpower = 1; willpower <= 1200; willpower += 1) {
    const current = moon.furyDurationMs(5, willpower);
    if (current < previous) strictly = false;
    previous = current;
  }
  ok("each Willpower point never shortens the flask", strictly);

  ok(
    "the curve never passes double",
    moon.furyDurationMs(5, 10_000_000) < 2 * 5 * 60_000 &&
      moon.furyWillpowerBonus(10_000_000) < CONST.FURY_WILLPOWER_MAX_BONUS,
  );
  ok(
    "the curve follows the dodge and critical family",
    Math.abs(
      moon.furyWillpowerBonus(250) -
        CONST.FURY_WILLPOWER_MAX_BONUS / 2,
    ) < 1e-9,
  );
  ok("100 Willpower yields 6.4 min on the medium flask", moon.furyDurationMinutes(5, 100) === 6.4);
  ok("550 Willpower yields 8.4 min on the medium flask", moon.furyDurationMinutes(5, 550) === 8.4);
  ok("without Willpower the extra is zero", moon.furyWillpowerExtraMs(2.5, 0) === 0);
  ok(
    "100 de Vontade no frasco pequeno soma 42s inteiros",
    moon.furyWillpowerExtraMs(2.5, 100) === 42_000,
  );

  const plain = baseState({ level: 10 });
  const bag = {
    ...plain,
    character: { ...plain.character, attributes: { ...plain.character.attributes, willpower: 250 } },
    equipment: {},
    inventory: [{ itemId: "rage-potion-medium", quantity: 1, enhancement: 0 }],
  };
  const drunk = inventoryCtrl.consumeItem(bag, "rage-potion-medium");
  ok("drinking the potion records the stretched deadline", drunk.ok === true, drunk.message);
  if (drunk.ok) {
    const left = Date.parse(drunk.state.character.furyUntil) - Date.now();
    ok(
      "prazo gravado bate com a regra",
      Math.abs(left - moon.furyDurationMs(5, 250)) < 2_000,
      String(left) + " vs " + moon.furyDurationMs(5, 250),
    );
    ok("the stretched deadline passes the label", left > 5 * 60_000);
  }
}
sec("inventory and market");
{
  const random = seededRandom(31337);
  let inventory = [];
  const expected = new Map();
  const ids = ["health-potion-small", "bronze-fragment", "rabbit-fur", "bronze-claw"];
  for (let step = 0; step < 400; step += 1) {
    const id = ids[Math.floor(random() * ids.length)];
    const amount = 1 + Math.floor(random() * 3);
    if (random() < 0.55) {
      inventory = inventoryCtrl.addToInventory(inventory, id, amount);
      expected.set(id, (expected.get(id) ?? 0) + amount);
    } else {
      const have = expected.get(id) ?? 0;
      const take = Math.min(have, amount);
      inventory = inventoryCtrl.removeFromInventory(inventory, id, amount);
      expected.set(id, have - take);
    }
    const id2 = ids[Math.floor(random() * ids.length)];
    if (inventoryCtrl.countInInventory(inventory, id2) !== (expected.get(id2) ?? 0)) {
      ok("bag conservation at step " + step, false, id2);
      break;
    }
  }
  ok(
    "mochila nunca fica negativa",
    inventory.every((slot) => slot.quantity > 0),
  );
  const state = baseState({ level: 1, gender: "female" });
  const bought = marketCtrl.buyItem(state, "bronze-claw", 1);
  const clawPrice = items.findItem("bronze-claw").price;
  ok(
    "a purchase deducts the price",
    bought.ok && bought.state.character.bronze === state.character.bronze - clawPrice,
  );
  ok("duplicated piece now enters", marketCtrl.buyItem(state, "bronze-claw", 2).ok === true);
  ok(
    "a piece already in the bag now enters",
    bought.ok && marketCtrl.buyItem(bought.state, "bronze-claw", 1).ok === true,
  );
  ok(
    "potions buy in quantity",
    marketCtrl.buyItem(state, "health-potion-small", 3).ok === true,
  );
  const maleCoat = marketCtrl.buyItem(state, "bronze-armor-male", 1);
  ok("Luna does not buy Lumni's coat", maleCoat.ok === false);
  const femaleCoat = marketCtrl.buyItem(state, "bronze-armor-female", 1);
  ok("Luna buys her coat", femaleCoat.ok === true);
  if (femaleCoat.ok) {
    ok(
      "Luna veste o casaco dela",
      inventoryCtrl.equipItem(femaleCoat.state, "bronze-armor-female").ok === true,
    );
  }
  const highSet = marketCtrl.buyItem(state, "lunar-claw", 1);
  ok("market respects the level", highSet.ok === false);
  ok("ration without a wolf refuses", marketCtrl.buyItem(state, "pet-ration", 1).ok === false);
  ok(
    "a small potion costs 50 WCoins",
    marketCtrl.marketPriceOf(items.findItem("health-potion-small"), 100) === 50,
  );
  ok(
    "a large potion costs 300 WCoins",
    marketCtrl.marketPriceOf(items.findItem("health-potion-large"), 100) === 300,
  );
  ok(
    "a small fury potion costs 300 WCoins",
    marketCtrl.marketPriceOf(items.findItem("rage-potion-small"), 100) === 300,
  );
  ok(
    "a medium fury potion costs 600 WCoins",
    marketCtrl.marketPriceOf(items.findItem("rage-potion-medium"), 100) === 600,
  );
  ok(
    "a large fury potion costs 900 WCoins",
    marketCtrl.marketPriceOf(items.findItem("rage-potion-large"), 100) === 900,
  );
  ok(
    "a ration costs a hunt and a half",
    marketCtrl.marketPriceOf(items.findItem("pet-ration"), 100) ===
      Math.max(1, Math.round(species.huntPurse(100) * 1.5)),
  );
  ok(
    "equipment keeps the catalog's fixed price",
    marketCtrl.marketPriceOf(items.findItem("bronze-claw"), 100) ===
      items.findItem("bronze-claw").price,
  );
  const fragmentSale = marketCtrl.sellItem(
    { ...state, inventory: [{ itemId: "bronze-fragment", quantity: 5, enhancement: 0 }] },
    "bronze-fragment",
    1,
  );
  ok("fragment does not sell for bronze", fragmentSale.ok === false);
  const sale = marketCtrl.sellItem(
    { ...state, inventory: [{ itemId: "rabbit-fur", quantity: 5, enhancement: 0 }] },
    "rabbit-fur",
    2,
  );
  const fur = items.findItem("rabbit-fur");
  ok(
    "a drop sale pays half plus the bonus of 5",
    sale.ok &&
      sale.state.character.bronze ===
        state.character.bronze + (Math.max(1, Math.round(fur.price * 0.5)) + 5) * 2,
  );
  const forgedSale = marketCtrl.sellItem(
    { ...state, inventory: [{ itemId: "bronze-claw", quantity: 1, enhancement: 3 }] },
    "bronze-claw",
    1,
    3,
  );
  const claw = items.findItem("bronze-claw");
  ok(
    "a forged piece sells at the plain price, no forge bonus",
    forgedSale.ok &&
      forgedSale.state.character.bronze ===
        state.character.bronze + Math.max(1, Math.round(claw.price * 0.5)) &&
      forgedSale.state.inventory.length === 0,
  );
  const wrongCopy = marketCtrl.sellItem(
    { ...state, inventory: [{ itemId: "bronze-claw", quantity: 1, enhancement: 3 }] },
    "bronze-claw",
    1,
    0,
  );
  ok("selling the copy that does not exist is refused", wrongCopy.ok === false);
  const dressed = inventoryCtrl.equipItem(bought.state, "bronze-claw");
  ok(
    "equipar tira da mochila",
    dressed.ok &&
      inventoryCtrl.countInInventory(dressed.state.inventory, "bronze-claw") === 0 &&
      dressed.state.equipment.claw &&
      dressed.state.equipment.claw.itemId === "bronze-claw",
  );
  ok(
    "a piece on the body allows buying another copy",
    dressed.ok && marketCtrl.buyItem(dressed.state, "bronze-claw", 1).ok === true,
  );
  const spareState = dressed.ok
    ? {
        ...dressed.state,
        inventory: [
          ...dressed.state.inventory,
          { itemId: "bronze-claw", quantity: 1, enhancement: 0 },
        ],
      }
    : dressed.state;
  const swapped = inventoryCtrl.equipItem(spareState, "bronze-claw");
  ok(
    "swapping for the same piece preserves",
    swapped.ok && inventoryCtrl.countInInventory(swapped.state.inventory, "bronze-claw") === 1,
  );
  const potion = inventoryCtrl.consumeItem(
    { ...state, inventory: [{ itemId: "health-potion-small", quantity: 1, enhancement: 0 }] },
    "health-potion-small",
  );
  ok("potion without a wound refuses", potion.ok === false);
  const hurt = {
    ...state,
    character: { ...state.character, health: 1 },
    inventory: [{ itemId: "health-potion-small", quantity: 1, enhancement: 0 }],
  };
  const healed = inventoryCtrl.consumeItem(hurt, "health-potion-small", seededRandom(42));
  const derived = stats.deriveStats(state.character, state.equipment, null);
  const expectedGain = load("shared/utils/random.js").intBetween(150, 200, seededRandom(42));
  ok(
    "a potion heals a fixed range",
    healed.ok &&
      healed.state.character.health === Math.min(derived.maxHealth, 1 + expectedGain),
  );
  const store = storeCtrl.purchasePack(state, "two-pouches");
  ok(
    "pacote credita a bolsa da loja",
    store.ok &&
      store.state.character.bronze ===
        state.character.bronze + storeRules.packBronze(packsData.STORE_PACKS[1]),
  );
}
sec("names");
{
  const nasty = [
    "  joão da silva  ",
    "luna!!",
    "l o b o",
    "x".repeat(60),
    "🐺lobo🐺",
    "a",
    "wolf<script>",
    "María-José",
    "123lobo",
    "ção",
    "́abc",
    "LOBO",
    "presa\tnegra",
    "presa\nnegra",
    "ãÉí",
    "𝕃𝕠𝕓𝕠",
    "ᏔᎾᏞF",
    "",
    "   ",
    "ll",
  ];
  for (const raw of nasty) {
    const clean = sanitizeName(raw, CONST.NAME_MAX_LENGTH);
    ok("idempotent sanitize: " + json(raw), sanitizeName(clean, CONST.NAME_MAX_LENGTH) === clean);
    ok("no space and no sign: " + json(raw), /^[\p{L}\p{M}\p{N}]*$/u.test(clean));
    ok("up to 25: " + json(raw), clean.length <= 25);
    if (clean.length >= CONST.NAME_MIN_LENGTH) {
      ok(
        "validateName aceita o sanitizado: " + json(raw),
        characterCtrl.validateName(clean) === null,
      );
      ok(
        "validateRoomName aceita o sanitizado: " + json(raw),
        entTavern.validateRoomName(clean) === null,
      );
    }
  }
  ok("space is refused", characterCtrl.validateName("dois nomes") !== null);
  ok("short is refused", characterCtrl.validateName("ab") !== null);
  ok("number enters", characterCtrl.validateName("Lobo77") === null);
}
sec("ranking");
{
  const roster = Array.from({ length: 25 }, (_, index) =>
    benchHunter("bench-" + index, 10 + index * 37, {
      gender: index % 3 === 0 ? "female" : "male",
    }),
  );
  const board = rankingRules.buildBoard(
    roster,
    { key: "level", label: "", description: "", value: (hunter) => hunter.level },
    null,
  );
  ok("positions 1..25", board[0].position === 1 && board[24].position === 25);
  let sorted = true;
  for (let index = 1; index < board.length; index += 1) {
    if (board[index].value > board[index - 1].value) sorted = false;
  }
  ok("board sorts from highest to lowest", sorted);
  const state = baseState({ level: 500 });
  const view = rankingCtrl.listRanking(state, roster, "level", 1);
  ok("player enters the board", view.playerPosition !== null && view.boardSize === 26);
  const searched = rankingCtrl.listRanking(state, roster, "level", 1, "Teste");
  ok("search finds the player", searched.total >= 1);
  ok(
    "the search keeps the true position",
    searched.entries.find((entry) => entry.isPlayer)?.position === view.playerPosition,
  );
  const cut = rankingCtrl.listRanking(state, roster, "level", 1, "", "female");
  ok(
    "the gender cut filters without renumbering",
    cut.entries.length > 0 &&
      cut.entries.every((entry) => entry.hunter.gender === "female") &&
      cut.entries.every(
        (entry) => board.find((line) => line.hunter.id === entry.hunter.id)?.position !== undefined,
      ),
  );
  const wolfBoard = entRanking.findBoard("pet");
  ok(
    "the companion board reads the wolf's level",
    wolfBoard.key === "pet" &&
      wolfBoard.value({
        ...roster[0],
        pet: { name: "Lobo", gender: "male", level: 7, energy: 50, active: true },
      }) === 7,
  );
  ok("without a wolf the companion board reads zero", wolfBoard.value(roster[0]) === 0);
  const profile = rankingCtrl.profileOf(state, roster, "bench-0");
  ok("another hunter's profile opens", profile !== null && profile.positions.length === 12);
  ok("profile without NaN", profile !== null && Number.isFinite(profile.stats.maxHealth));
  const own = rankingCtrl.profileOf(state, roster, state.character.id);
  ok("the own sheet recognizes itself", own !== null && own.isPlayer === true);
  const empty = rankingCtrl.listRanking(state, [], "level", 1);
  ok(
    "quadro vazio ainda mostra o jogador",
    empty.boardSize === 1 && empty.playerPosition === 1,
  );
}
sec("character");
{
  const run = factory.createRun("Luna", "female");
  const derived = stats.deriveStats(run.character, run.equipment, null);
  ok(
    "nasce inteiro",
    run.character.health === derived.maxHealth,
  );
  ok("born with 200 bronze", run.character.bronze === CONST.STARTING_BRONZE);
  ok(
    "starts with ten small fury potions",
    run.inventory.some(
      (slot) => slot.itemId === "rage-potion-small" && slot.quantity === 10,
    ),
  );
  ok(
    "nasce sem equipamento",
    Object.values(run.equipment).every((slot) => slot === null),
  );
  ok("born at level 1", run.character.level === 1);
  ok(
    "the bloodline adds its bonus",
    run.character.attributes.agility === 18 && run.character.attributes.strength === 4,
  );
  const state = baseState({ level: 10 });

  const withPotion = {
    ...state,
    inventory: [{ itemId: "rage-potion-small", quantity: 1, enhancement: 0 }],
  };
  const drank = inventoryCtrl.consumeItem(withPotion, "rage-potion-small");
  ok("fury potion becomes a buff", drank.ok && typeof drank.state.character.furyUntil === "string");
  ok("the buff is active now", Date.parse(drank.state.character.furyUntil) > Date.now());
  const buffedStats = stats.deriveStats(drank.state.character, drank.state.equipment, null);
  const plainStats = stats.deriveStats(state.character, state.equipment, null);
  ok(
    "the buff lifts Strength by " + CONST.FURY_ATTRIBUTE_BONUS,
    buffedStats.totalAttributes.strength ===
      plainStats.totalAttributes.strength + CONST.FURY_ATTRIBUTE_BONUS,
  );
  ok("the fury potion returns no health", drank.state.character.health === state.character.health);
  const withTwo = {
    ...state,
    inventory: [{ itemId: "rage-potion-small", quantity: 2, enhancement: 0 }],
  };
  const firstSip = inventoryCtrl.consumeItem(withTwo, "rage-potion-small");
  const recast = firstSip.ok
    ? inventoryCtrl.consumeItem(firstSip.state, "rage-potion-small")
    : firstSip;
  ok("drinking again restarts the clock", recast.ok === true, recast.message);
  if (firstSip.ok && recast.ok) {
    ok(
      "the new deadline never falls behind the previous one",
      Date.parse(recast.state.character.furyUntil) >= Date.parse(firstSip.state.character.furyUntil),
    );
  }
  const expired = {
    ...state,
    character: {
      ...state.character,
      furyUntil: new Date(Date.now() - 1000).toISOString(),
    },
    inventory: [{ itemId: "rage-potion-small", quantity: 1, enhancement: 0 }],
  };
  ok(
    "an expired deadline adds no fury",
    stats.deriveStats(expired.character, expired.equipment, null).sources.fury.strength === 0,
  );
  const revived = inventoryCtrl.consumeItem(expired, "rage-potion-small");
  ok(
    "after the deadline the fury returns",
    revived.ok === true && Date.parse(revived.state.character.furyUntil) > Date.now(),
    revived.message,
  );

  setMoon("full");
  const fullMoonPotion = {
    ...state,
    inventory: [{ itemId: "rage-potion-small", quantity: 1, enhancement: 0 }],
  };
  const refusedFury = inventoryCtrl.consumeItem(fullMoonPotion, "rage-potion-small");
  ok("full moon refuses fury potion", !refusedFury.ok);
  setMoon("waning");

  const bloated = { ...state, character: { ...state.character, health: 99999 } };
  const squeezed = characterCtrl.syncCharacter(bloated);
  const ceiling = stats.deriveStats(state.character, state.equipment, null);
  ok("shrunken cap squeezes health", squeezed.character.health === ceiling.maxHealth);
  ok("up-to-date body keeps its reference", characterCtrl.syncCharacter(state) === state);

  const tired = { ...state, character: { ...state.character, health: 50 } };
  const resting = characterCtrl.startRest(tired);
  ok("resting while wounded is allowed", resting.ok);
  const tick = characterCtrl.restTick(resting.state);
  const restedDerived = stats.deriveStats(resting.state.character, state.equipment, null);
  const max = restedDerived.maxHealth;
  const restHeal = Math.max(
    1,
    Math.ceil(max * characterCtrl.restRecoveryRatio(restedDerived.totalAttributes.willpower)),
  );
  ok(
    "o tique devolve vida pela vontade e pelo passo do descanso",
    tick.ok && tick.state.character.health === Math.min(max, 50 + restHeal),
  );
  ok(
    "willpower speeds up recovery",
    characterCtrl.restRecoveryRatio(500) > characterCtrl.restRecoveryRatio(0) &&
      characterCtrl.restRecoveryRatio(0) === CONST.REST_HEALTH_RATIO,
  );
  const whole = baseState({ level: 10 });
  ok("whole does not rest", characterCtrl.startRest(whole).ok === false);
  const blow = characterCtrl.sufferBlow(state, 40);
  ok("narrated blow bleeds outside", blow.state.character.health === state.character.health - 40);
  const lethal = characterCtrl.sufferBlow(state, 999999);
  ok("narrated blow never kills", lethal.state.character.health === 1);
  const spam = Array.from({ length: 130 }).reduce(
    (current) => logCtrl.addLog(current, "system", "eco"),
    state,
  );
  ok("diary keeps at most 120", spam.log.length <= CONST.LOG_LIMIT);
}
sec("automation");
{
  const quiet = baseState({ level: 10 });
  ok("everything off, nothing happens", automationCtrl.nextAutomationStep(quiet, null) === null);
  const low = baseState({ level: 10 });
  const floor = stats.deriveStats(low.character, low.equipment, null).maxHealth;
  low.character.health = Math.max(1, Math.floor(floor * 0.1));
  ok(
    "hurt on the floor does not drink without the potion switch",
    automationCtrl.nextAutomationStep(low, null) === null,
  );
  const bareFloor = { ...low, inventory: [] };
  ok(
    "hurt on the floor does not rest without the rest switch",
    automationCtrl.nextAutomationStep(bareFloor, null) === null,
  );
  const withPotion = { ...low, automation: { ...low.automation, potion: true } };
  const step = automationCtrl.nextAutomationStep(withPotion, null);
  ok("wounded drinks the smallest potion", step?.kind === "potion" && step.itemId === "health-potion-small");
  const noFlask = {
    ...withPotion,
    inventory: [],
    automation: { ...low.automation, potion: true, rest: true },
  };
  ok("without a potion, lies down", automationCtrl.nextAutomationStep(noFlask, null)?.kind === "rest");
  ok(
    "while training, the floor does not interrupt",
    automationCtrl.nextAutomationStep(noFlask, { kind: "train", id: "trunk-punches" }) === null,
  );
  const petState = baseState({ level: 10 });
  petState.pet = {
    id: "p",
    name: "L",
    gender: "male",
    energy: 0,
    active: true,
    level: 1,
    trainingProgress: 0,
    adoptedAt: "",
  };
  petState.inventory = [{ itemId: "pet-ration", quantity: 1, enhancement: 0 }];
  const fed = { ...petState, automation: { ...petState.automation, petFeed: true } };
  ok("empty wolf eats on its own", automationCtrl.nextAutomationStep(fed, null)?.kind === "feed");
  const noRation = {
    ...petState,
    inventory: [],
    automation: { ...petState.automation, petRest: true },
  };
  const kennel = automationCtrl.nextAutomationStep(noRation, null);
  ok("without food goes home", kennel?.kind === "kennel" && kennel.active === false);
  const restedPet = {
    ...petState,
    pet: { ...petState.pet, energy: 100, active: false },
    automation: { ...petState.automation, petRest: true },
  };
  const called = automationCtrl.nextAutomationStep(restedPet, null);
  ok("full returns to the hunt", called?.kind === "kennel" && called.active === true);
  const shortPetState = {
    ...petState,
    pet: {
      ...petState.pet,
      energy: CONST.PET_ENERGY_PER_HUNT + CONST.PET_ENERGY_PER_BLOW - 1,
    },
    automation: { ...petState.automation, petFeed: true },
  };
  ok(
    "a breathless wolf eats before hitting zero",
    automationCtrl.nextAutomationStep(shortPetState, null)?.kind === "feed",
  );
  const restKeyOnly = { ...petState, automation: { ...petState.automation, petRest: true } };
  ok(
    "wolf repose does not feed without the food switch",
    automationCtrl.nextAutomationStep(restKeyOnly, null) === null,
  );
  const restFeed = {
    ...petState,
    automation: { ...petState.automation, petRest: true, petFeed: true },
  };
  ok(
    "with automatic food, the ration beats the kennel",
    automationCtrl.nextAutomationStep(restFeed, null)?.kind === "feed",
  );
  const paused = baseState({ level: 10, form: "werewolf" });
  const idle = { kind: "hunt", id: "village-field", paused: true };
  ok("paused without the switch waits", automationCtrl.nextAutomationStep(paused, idle) === null);
  const resumed = { ...paused, automation: { ...paused.automation, hunt: true } };
  const work = automationCtrl.nextAutomationStep(resumed, idle);
  ok("paused with the switch resumes", work?.kind === "work" && work.activity.paused === false);
  ok(
    "retomar volta ao mesmo trabalho",
    work?.activity.kind === "hunt" && work?.activity.id === "village-field",
  );
  const spentMine = baseState({ level: 10 });
  spentMine.mining = {
    ...spentMine.mining,
    count: CONST.MINING_DAILY_MININGS,
    windowStart: new Date().toISOString(),
  };
  spentMine.automation = { ...spentMine.automation, mine: true };
  ok(
    "an exhausted mine does not resume",
    automationCtrl.nextAutomationStep(spentMine, { kind: "mine", id: "bronze-vein", paused: true }) ===
      null,
  );
  const furyHunt = {
    ...resumed,
    inventory: [{ itemId: "rage-potion-small", quantity: 1, enhancement: 0 }],
    automation: { ...resumed.automation, hunt: true, transform: true },
  };
  const furyStep = automationCtrl.nextAutomationStep(furyHunt, idle);
  ok(
    "a paused hunt drinks fury before resuming",
    furyStep?.kind === "potion" && furyStep.itemId === "rage-potion-small",
  );
  const furyAlone = {
    ...furyHunt,
    automation: { ...resumed.automation, hunt: false, transform: true },
  };
  ok(
    "automatic fury drinks on its own during the hunt",
    automationCtrl.nextAutomationStep(furyAlone, idle)?.itemId === "rage-potion-small",
  );
  ok(
    "automatic fury does not drink while idle",
    automationCtrl.nextAutomationStep(furyAlone, null) === null,
  );
  ok(
    "an ongoing hunt also asks for the flask",
    automationCtrl.nextAutomationStep(furyAlone, { kind: "hunt", id: "village-field" })?.itemId ===
      "rage-potion-small",
  );
  const furyReady = {
    ...furyHunt,
    character: {
      ...furyHunt.character,
      furyUntil: new Date(Date.now() + 60000).toISOString(),
    },
  };
  ok(
    "with fury on the hunt resumes",
    automationCtrl.nextAutomationStep(furyReady, idle)?.kind === "work",
  );
  const healThenFury = { ...low };
  healThenFury.character.health = Math.floor(
    stats.deriveStats(healThenFury.character, healThenFury.equipment, null).maxHealth *
      CONST.MIN_HEALTH_RATIO_TO_ACT,
  );
  healThenFury.inventory = [
    { itemId: "health-potion-small", quantity: 1, enhancement: 0 },
    { itemId: "rage-potion-small", quantity: 1, enhancement: 0 },
  ];
  healThenFury.automation = {
    ...healThenFury.automation,
    hunt: true,
    transform: true,
    potion: true,
  };
  ok(
    "on the floor health comes before fury",
    automationCtrl.nextAutomationStep(healThenFury, idle)?.itemId === "health-potion-small",
  );
  const bothKeys = { ...low, automation: { ...low.automation, potion: true, rest: true } };
  ok(
    "with a flask in the bag the potion beats rest",
    automationCtrl.nextAutomationStep(bothKeys, null)?.kind === "potion",
  );
  const floorTurn = {
    ...low,
    character: { ...low.character, rage: 100 },
    automation: { ...low.automation, transform: true, potion: true },
  };
  ok(
    "on the floor the fury waits, recover first",
    automationCtrl.nextAutomationStep(floorTurn, idle)?.kind === "potion" &&
      !automationCtrl.nextAutomationStep(floorTurn, idle)?.itemId?.startsWith("rage"),
  );
  ok(
    "already resting does not lie down again",
    automationCtrl.nextAutomationStep(noFlask, { kind: "rest" }) === null,
  );
  const trainKeyed = baseState({ level: 10, form: "werewolf" });
  trainKeyed.character.bronze = 100000;
  trainKeyed.automation = { ...trainKeyed.automation, train: true };
  const wokenUp = automationCtrl.resumeAfterRest(trainKeyed, {
    kind: "rest",
    resume: { kind: "train", id: "ice-bath" },
  });
  ok(
    "descanso completo devolve o trabalho interrompido",
    wokenUp?.kind === "train" && wokenUp.id === "ice-bath",
  );
  ok(
    "without the switch rest gives nothing back",
    automationCtrl.resumeAfterRest(baseState({ level: 10 }), {
      kind: "rest",
      resume: { kind: "train", id: "ice-bath" },
    }) === null,
  );
  ok(
    "rest with no memory gives nothing back",
    automationCtrl.resumeAfterRest(trainKeyed, { kind: "rest" }) === null,
  );
}
sec("tavern");
{
  const me = { id: "eu", name: "Teste", level: 60 };
  const other = { id: "ela", name: "Luna", level: 60 };
  const third = { id: "ele", name: "Lumni", level: 60 };
  let tavern = entTavern.emptyTavern();
  const bad = tavernCtrl.createRoom(tavern, me, "mesa da lua", "");
  ok("name with space refuses", bad.ok === false);
  const lowbie = { id: "novato", name: "Novato", level: 10 };
  ok(
    "a table without a password takes the minimum LV to open",
    tavernCtrl.createRoom(entTavern.emptyTavern(), lowbie, "Ninho", "").ok === false,
  );
  ok(
    "VIP abaixo do NV abre mesa sem senha",
    tavernCtrl.createRoom(entTavern.emptyTavern(), { ...lowbie, vip: true }, "Ninho", "").ok ===
      true,
  );
  ok(
    "with a password the novice opens at any level",
    tavernCtrl.createRoom(entTavern.emptyTavern(), lowbie, "Ninho", "chave").ok === true,
  );
  const opened = tavernCtrl.createRoom(tavern, me, "Fogueira", "");
  ok("table opens", opened.ok === true);
  tavern = opened.state;
  ok("table gets the #1", tavernCtrl.findRoom(tavern, opened.roomId).number === 1);
  ok("name starts visible", tavernCtrl.findRoom(tavern, opened.roomId).nameHidden === false);
  ok("the owner is already seated", tavernCtrl.findRoom(tavern, opened.roomId).members.length === 1);
  ok(
    "a table without a password takes the minimum LV to enter",
    tavernCtrl.joinRoom(tavern, opened.roomId, lowbie, "").ok === false,
  );
  ok(
    "segunda mesa do mesmo dono recusa",
    tavernCtrl.createRoom(tavern, me, "Outra", "").ok === false,
  );
  ok("repeated name refuses", tavernCtrl.createRoom(tavern, other, "fogueira", "").ok === false);
  const joined = tavernCtrl.joinRoom(tavern, opened.roomId, other, "");
  ok("joining works", joined.ok === true);
  tavern = joined.state;
  for (let extra = 0; extra < 18; extra += 1) {
    tavern = tavernCtrl.joinRoom(
      tavern,
      opened.roomId,
      { id: "x" + extra, name: "Lobo" + extra, level: 60 },
      "",
    ).state;
  }
  ok(
    "the twenty-first chair does not exist",
    tavernCtrl.joinRoom(tavern, opened.roomId, { id: "sobra", name: "Sobra", level: 60 }, "").ok ===
      false,
  );
  const backdate = () => {
    const seatRoom = tavernCtrl.findRoom(tavern, opened.roomId);
    const last = seatRoom.messages[seatRoom.messages.length - 1];
    if (last) last.at = new Date(Date.now() - 60000).toISOString();
  };
  for (let index = 0; index < entTavern.MAX_ROOM_MESSAGES + 10; index += 1) {
    tavern = tavernCtrl.sendMessage(tavern, opened.roomId, me, "eco " + index).state;
    backdate();
  }
  ok(
    "mesa guarda " + entTavern.MAX_ROOM_MESSAGES + " falas",
    tavernCtrl.findRoom(tavern, opened.roomId).messages.length === entTavern.MAX_ROOM_MESSAGES,
  );
  const rushedFirst = tavernCtrl.sendMessage(tavern, opened.roomId, me, "primeira do compasso");
  ok("line outside the beat passes", rushedFirst.ok === true);
  ok(
    "uma fala a cada dez segundos",
    tavernCtrl.sendMessage(rushedFirst.state, opened.roomId, me, "segunda imediata").ok === false,
  );
  const longTalk = tavernCtrl.sendMessage(tavern, opened.roomId, other, "a".repeat(200));
  ok(
    "a line is cut at 150",
    longTalk.ok &&
      tavernCtrl
        .findRoom(longTalk.state, opened.roomId)
        .messages.at(-1).text.length === entTavern.MESSAGE_MAX_LENGTH,
  );
  const wentOut = tavernCtrl.leaveRoom(tavern, opened.roomId, { id: "x0", name: "Lobo0" });
  ok(
    "leaving for good writes left the table",
    tavernCtrl.findRoom(wentOut.state, opened.roomId).messages.at(-1).text ===
      "Lobo0 left the table.",
  );
  const stepped = tavernCtrl.announceAway(tavern, opened.roomId, me);
  ok(
    "closing the window goes to get a drink",
    stepped.ok &&
      tavernCtrl.findRoom(stepped.state, opened.roomId).messages.at(-1).text ===
        me.name + " went to get a drink.",
  );
  ok(
    "from outside no away notice is written",
    tavernCtrl.announceAway(tavern, opened.roomId, { id: "fora", name: "Fora" }).ok === false,
  );
  const cameBack = tavernCtrl.joinRoom(tavern, opened.roomId, me, "");
  ok(
    "the return writes at the table",
    tavernCtrl.findRoom(cameBack.state, opened.roomId).messages.at(-1).text ===
      me.name + " returned to the table.",
  );
  ok("empty line refuses", tavernCtrl.sendMessage(tavern, opened.roomId, me, "   ").ok === false);
  ok(
    "link com https recusa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "olha https://exemplo.com/x").ok === false,
  );
  ok(
    "link com www recusa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "entra em www.exemplo.io").ok === false,
  );
  ok(
    "a bare domain refuses",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "acessa exemplo.com agora").ok === false,
  );
  ok(
    "link do wizold passa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "joga em https://wizold.lumni.dev.br").ok ===
      true,
  );
  ok(
    "link da lumni passa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "politica em lumni.dev.br/privacy").ok === true,
  );
  ok(
    "wizold.com.br passa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "https://wizold.com.br em breve").ok === true,
  );
  ok(
    "youtube passa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "live em youtube.com/watch?v=abc").ok === true,
  );
  ok(
    "twitch passa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "www.twitch.tv/canal").ok === true,
  );
  ok(
    "imgur passa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "print em https://i.imgur.com/abc123.png").ok ===
      true,
  );
  ok(
    "a random site still refuses",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "spam em https://malicioso.net/x").ok === false,
  );
  {
    const youtube = splitChatLinks("live em youtube.com/watch?v=abc agora");
    const twitch = splitChatLinks("www.twitch.tv/canal.");
    const site = splitChatLinks("joga em https://wizold.lumni.dev.br");
    const blocked = splitChatLinks("spam em https://malicioso.net/x");
    ok(
      "youtube permitido vira href",
      youtube.some((part) => part.kind === "link" && part.href === "https://youtube.com/watch?v=abc"),
    );
    ok(
      "www gains https and punctuation stays out",
      twitch.some((part) => part.kind === "link" && part.href === "https://www.twitch.tv/canal") &&
        twitch.some((part) => part.kind === "text" && part.value === "."),
    );
    ok(
      "https do wizold fica no href",
      site.some(
        (part) => part.kind === "link" && part.href === "https://wizold.lumni.dev.br",
      ),
    );
    ok(
      "a refused site does not become a link",
      blocked.every((part) => part.kind === "text"),
    );
  }
  ok(
    "e-mail passa na mesa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "me chama em daniel@gmail.com").ok === true,
  );
  ok(
    "e-mail com dominio de fora passa",
    tavernCtrl.sendMessage(tavern, opened.roomId, other, "escreve para lobo@malicioso.net").ok ===
      true,
  );
  ok(
    "link solto ao lado do e-mail ainda recusa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "daniel@gmail.com e https://malicioso.net/x")
      .ok === false,
  );
  {
    const mail = splitChatLinks("me chama em daniel@gmail.com agora");
    ok(
      "e-mail nao vira link",
      mail.length === 1 && mail[0].kind === "text" && mail[0].value === "me chama em daniel@gmail.com agora",
    );
  }
  ok(
    "a line with punctuation passes",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "Boa noite, matilha. Tudo bem?").ok === true,
  );
  ok(
    "from outside nobody speaks",
    tavernCtrl.sendMessage(tavern, opened.roomId, { id: "fora", name: "Fora" }, "oi").ok === false,
  );
  {
    let vault = entTavern.emptyTavern();
    const boss = { id: "dono", name: "Dono" };
    const nosy = { id: "xereta", name: "Xereta" };
    const locked = tavernCtrl.createRoom(vault, boss, "Trancada", "segredo");
    ok("table with password opens", locked.ok === true);
    ok(
      "with a password the novice enters at any level",
      tavernCtrl.joinRoom(locked.state, locked.roomId, lowbie, "segredo").ok === true,
    );
    vault = tavernCtrl.sendMessage(locked.state, locked.roomId, boss, "conversa secreta").state;
    const stranger = tavernCtrl
      .listRooms(vault, nosy)
      .find((summary) => summary.room.id === locked.roomId);
    ok(
      "a stranger sees the locked table but not the talk",
      Boolean(stranger) && stranger.locked === true && stranger.room.messages.length === 0,
    );
    ok("the board never hands the password hash", stranger.room.password === null);
    const owner = tavernCtrl
      .listRooms(vault, boss)
      .find((summary) => summary.room.id === locked.roomId);
    ok(
      "the owner reads their own talk without the hash",
      owner.room.messages.length === 2 && owner.room.password === null,
    );
    const forged = tavernCtrl.leaveRoom(vault, locked.roomId, nosy);
    ok("stranger cannot force-leave to sweep the table", forged.ok === false);
    ok(
      "a conversa da mesa trancada segue intacta",
      tavernCtrl.findRoom(forged.state, locked.roomId).messages.length === 2,
    );
  }
  {
    ok(
      "mesa reservada sem senha recusa",
      tavernCtrl.createRoom(entTavern.emptyTavern(), me, "Secreta", "", true).ok === false,
    );
    ok(
      "even VIP does not open a reserved table without a password",
      tavernCtrl.createRoom(
        entTavern.emptyTavern(),
        { ...lowbie, vip: true },
        "Secreta",
        "",
        true,
      ).ok === false,
    );
    const hide = tavernCtrl.createRoom(entTavern.emptyTavern(), me, "Secreta", "chave", true);
    ok("hidden table opens with password", hide.ok === true);
    ok("hidden table stays locked", tavernCtrl.findRoom(hide.state, hide.roomId).password !== null);
    const pair = tavernCtrl.createRoom(hide.state, other, "Clara", "");
    ok(
      "the second table is #2",
      pair.ok && tavernCtrl.findRoom(pair.state, pair.roomId).number === 2,
    );
    const listed = tavernCtrl
      .listRooms(hide.state, other)
      .find((summary) => summary.room.id === hide.roomId);
    ok(
      "de fora o nome some",
      Boolean(listed) &&
        listed.room.name === "" &&
        listed.room.nameHidden === true &&
        listed.room.number === 1,
    );
    ok(
      "de fora a busca pelo nome falha",
      listed && entTavern.roomMatchesSearch(listed.room, false, "secreta") === false,
    );
    ok(
      "from outside the number search finds it",
      listed &&
        entTavern.roomMatchesSearch(listed.room, false, "#1") &&
        entTavern.roomMatchesSearch(listed.room, false, "1"),
    );
    const inside = tavernCtrl
      .listRooms(hide.state, me)
      .find((summary) => summary.room.id === hide.roomId);
    ok("from inside the name stays", Boolean(inside) && inside.room.name === "Secreta");
    ok(
      "de dentro a busca pelo nome acha",
      inside && entTavern.roomMatchesSearch(inside.room, true, "secre"),
    );
    const closed = tavernCtrl.closeRoom(hide.state, hide.roomId, me);
    const again = tavernCtrl.createRoom(closed.state, me, "Nova", "");
    ok(
      "the number returns after closing",
      again.ok && tavernCtrl.findRoom(again.state, again.roomId).number === 1,
    );
    ok("search accepts the #", sanitizeRoomSearch("#17", 40) === "#17");
    ok(
      "the number reuses the gap",
      entTavern.nextRoomNumber([{ number: 1 }, { number: 3 }]) === 2,
    );
  }
  const direct = tavernCtrl.openDirect(tavern, me, other);
  ok("reserved table opens", direct.ok === true);
  tavern = direct.state;
  ok(
    "a third does not see the reserved table",
    tavernCtrl.listRooms(tavern, third).every((summary) => summary.room.id !== direct.roomId),
  );
  ok(
    "os dois veem a mesa",
    tavernCtrl.listRooms(tavern, other).some((summary) => summary.room.id === direct.roomId),
  );
  ok(
    "a third does not sit at the reserved table",
    tavernCtrl.joinRoom(tavern, direct.roomId, third, "").ok === false,
  );
  const reopened = tavernCtrl.openDirect(tavern, me, other);
  ok("reopening finds the same table", reopened.ok && reopened.roomId === direct.roomId);
  const dmFirst = tavernCtrl.sendMessage(tavern, direct.roomId, me, "primeira sem espera");
  ok("reserved table accepts the line", dmFirst.ok === true);
  ok(
    "mesa reservada fala sem compasso",
    tavernCtrl.sendMessage(dmFirst.state, direct.roomId, me, "segunda imediata").ok === true,
  );
  ok(
    "o compasso pertence a mesa aberta",
    entTavern.messageCooldownOf({ privateFor: ["a", "b"] }) === 0 &&
      entTavern.messageCooldownOf({}) === entTavern.MESSAGE_COOLDOWN_MS,
  );
  {
    const nicks = load("models/rules/tavern-nicks.js");
    ok("first seat takes color 0", nicks.claimNickColor([], 20) === 0);
    ok(
      "the next one takes the first free",
      nicks.claimNickColor([{ nickColor: 0 }, { nickColor: 2 }], 20) === 1,
    );
    ok("table of two only offers 0 and 1", nicks.claimNickColor([{ nickColor: 0 }], 2) === 1);
    const fire = tavernCtrl.findRoom(tavern, opened.roomId);
    const fireTones = new Set(fire.members.map((member) => member.nickColor));
    ok(
      "cada assento da mesa aberta tem cor distinta",
      fire.members.length === fireTones.size && fireTones.size >= 19,
    );
    const reservedSeats = tavernCtrl.findRoom(tavern, direct.roomId).members;
    ok(
      "mesa de dois pinta sem repetir",
      reservedSeats.length >= 1 &&
        reservedSeats.every((member) => member.nickColor === 0 || member.nickColor === 1) &&
        new Set(reservedSeats.map((member) => member.nickColor)).size === reservedSeats.length,
    );
  }
  {
    const at = "2026-09-02T20:00:00.000Z";
    const reserved = {
      room: {
        id: "dm",
        name: "Privada",
        password: null,
        ownerId: "a",
        createdAt: at,
        privateFor: ["a", "b"],
        members: [],
        messages: [
          { id: "1", authorId: "system", authorName: "Taverna", text: "x", at },
          { id: "2", authorId: "b", authorName: "B", text: "oi", at },
        ],
      },
      locked: false,
      full: false,
      memberCount: 2,
      isMember: true,
      isPrivate: true,
    };
    const open = {
      ...reserved,
      isPrivate: false,
      room: { ...reserved.room, id: "open", privateFor: undefined },
    };
    ok(
      "the ping reads the other's line at the reserved table",
      tavernCtrl.latestSeatedChatAt([reserved], "a") === at,
    );
    ok("ping ignores own line", tavernCtrl.latestSeatedChatAt([reserved], "b") === "");
    ok("ping reads the line at the open table", tavernCtrl.latestSeatedChatAt([open], "a") === at);
    ok(
      "the ping ignores whoever is not seated",
      tavernCtrl.latestSeatedChatAt([{ ...reserved, isMember: false }], "a") === "",
    );
  }
  {
    const fresh = new Date().toISOString();
    const stale = new Date(Date.now() - entActivity.ACTIVITY_STALE_MS - 1000).toISOString();
    ok("live hunt", entActivity.resolveDoing("hunt", fresh) === "hunt");
    ok("old activity becomes idle", entActivity.resolveDoing("hunt", stale) === "idle");
    ok("no activity is idle", entActivity.resolveDoing(null, null) === "idle");
    ok(
      "the hunt phrase",
      entActivity.describeDoing("Luna", "hunt") === "Luna is hunting",
    );
    ok(
      "the idle phrase",
      entActivity.describeDoing("Lumni", "idle") === "Lumni is idle",
    );
    ok(
      "your own hunt counts at once",
      entActivity.doingFor("eu", "eu", "hunt", {}) === "hunt",
    );
    ok(
      "the other one reads the board",
      entActivity.doingFor("ela", "eu", "hunt", { ela: "mine" }) === "mine",
    );
  }
  const stale = {
    ...tavern,
    rooms: tavern.rooms.map((room) => ({
      ...room,
      members: room.members.map((member) => ({
        ...member,
        lastSeen: new Date(Date.now() - entTavern.MEMBER_TIMEOUT_MS - 5000).toISOString(),
      })),
    })),
  };
  const pruned = tavernCtrl.pruneTavern(stale, Date.now());
  ok(
    "a vassoura fecha a mesa vazia",
    pruned.rooms.every((room) => room.id !== opened.roomId),
  );
  ok(
    "a vassoura poupa a reservada",
    pruned.rooms.some((room) => room.id === direct.roomId),
  );
  ok(
    "qualquer um dos dois fecha a reservada",
    tavernCtrl.closeRoom(pruned, direct.roomId, other).ok === true,
  );
}
sec("pack");
{
  const state = baseState({ level: 1 });
  const board = [
    { id: "mate-3", name: "Loba" },
    { id: "mate-5", name: "Aluado" },
    { id: "mate-6", name: "Aluada" },
  ];
  const added = packCtrl.addMate(state, { id: "mate-3", name: board[0].name });
  ok("saving a name works", added.ok === true);
  ok(
    "guardar de novo recusa",
    added.ok && packCtrl.addMate(added.state, { id: "mate-3", name: "x" }).ok === false,
  );
  ok(
    "guardar a si recusa",
    packCtrl.addMate(state, { id: state.character.id, name: "Eu" }).ok === false,
  );
  let full = state;
  for (let index = 0; index < 25; index += 1) {
    full = packCtrl.addMate(full, { id: "amigo-" + index, name: "Amigo" + index }).state;
  }
  ok("the pack stops at 20", full.pack.length === 20);
  const byNick = packCtrl.matchNick(normalizeText("Loba"), board);
  ok("exact nick finds", typeof byNick === "object" && byNick.id === "mate-3");
  const vague = packCtrl.matchNick("alua", board);
  ok("ambiguous piece refuses", typeof vague === "string");
  const nobody = packCtrl.matchNick("Fantasma", board);
  ok("ownerless nick refuses", typeof nobody === "string");
  const removed = packCtrl.removeMate(added.state, "mate-3");
  ok("deleting frees the slot", removed.ok && removed.state.pack.length === 0);
  const fresh = new Date().toISOString();
  ok(
    "recent active presence shows green",
    presenceRules.resolvePresence("active", fresh) === "active",
  );
  ok(
    "recent away presence shows red",
    presenceRules.resolvePresence("away", fresh) === "away",
  );
  ok(
    "old presence turns offline",
    presenceRules.resolvePresence(
      "active",
      new Date(Date.now() - presenceRules.PRESENCE_STALE_MS - 1).toISOString(),
    ) === "offline",
  );
  ok("explicit offline goes grey", presenceRules.resolvePresence("offline", fresh) === "offline");
}
sec("immutability");
{
  const random = seededRandom(777);
  const state = baseState({ level: 170, form: "werewolf" });
  state.pet = {
    id: "p",
    name: "Lobo",
    gender: "male",
    energy: 80,
    active: true,
    level: 3,
    trainingProgress: 5,
    adoptedAt: new Date().toISOString(),
  };
  state.equipment.claw = { itemId: "silver-claw", enhancement: 3 };
  state.inventory = [
    { itemId: "health-potion-small", quantity: 5, enhancement: 0 },
    { itemId: "silver-fragment", quantity: 20, enhancement: 0 },
    { itemId: "bronze-claw", quantity: 1, enhancement: 1 },
    { itemId: "pet-ration", quantity: 2, enhancement: 0 },
    { itemId: "rabbit-fur", quantity: 3, enhancement: 0 },
  ];
  state.bazaarListings = [];
  deepFreeze(state);
  const rival = benchHunter("pit-immut", 170);
  const pit = deepFreeze([rival, benchHunter("pit-immut-far", 900)]);
  const offer = deepFreeze({
    id: "listing_immut",
    sellerId: "chr_immut_seller",
    sellerName: "Vendedor",
    itemId: "bronze-claw",
    enhancement: 2,
    quantity: 2,
    priceCents: 300,
    announcedAt: new Date().toISOString(),
  });
  const calls = [
    ["listTerritories", () => huntCtrl.listTerritories(state)],
    [
      "resolveHunt+landHunt",
      () => {
        const resolved = huntCtrl.resolveHunt(state, "dew-woods", random);
        if (resolved.ok) huntCtrl.landHunt(state, deepFreeze(resolved.data), 10);
      },
    ],
    ["listArena", () => arenaCtrl.listArena(state, pit)],
    [
      "resolveArena+landArena",
      () => {
        const resolved = arenaCtrl.resolveArena(state, pit, rival.id, random);
        if (resolved.ok) arenaCtrl.landArena(state, deepFreeze(resolved.data), 0);
      },
    ],
    ["drawOpponent", () => arenaCtrl.drawOpponent(state, pit, random)],
    ["train", () => trainingCtrl.train(state, "ice-bath")],
    ["listExercises", () => trainingCtrl.listExercises(state)],
    ["trainPet", () => petCtrl.trainPet(state)],
    ["feedPet", () => petCtrl.feedPet(state, "pet-ration")],
    ["setPetActive", () => petCtrl.setPetActive(state, false)],
    ["restPetTick", () => petCtrl.restPetTick(state)],
    ["renamePet", () => petCtrl.renamePet(state, "Cinza")],
    ["releasePet", () => petCtrl.releasePet(state)],
    ["buyItem", () => marketCtrl.buyItem(state, "health-potion-small", 2)],
    ["sellItem", () => marketCtrl.sellItem(state, "rabbit-fur", 1)],
    ["listOffers", () => marketCtrl.listOffers(state)],
    ["equipItem", () => inventoryCtrl.equipItem(state, "bronze-claw", 1)],
    ["unequipItem", () => inventoryCtrl.unequipItem(state, "claw")],
    ["consumeItem", () => inventoryCtrl.consumeItem(state, "health-potion-small")],
    ["enhance", () => forgeCtrl.enhance(state, "bronze-claw", 1)],
    ["mine", () => forgeCtrl.mine(state, "bronze-vein", random)],
    ["listForge", () => forgeCtrl.listForge(state)],
    ["listMining", () => forgeCtrl.listMining(state)],
    ["announce+cancel", () => bazaarCtrl.announceListing(state, "silver-fragment", 3, 500)],
    ["listSellable", () => bazaarCtrl.listSellable(state)],
    ["listBoard", () => bazaarCtrl.listBoard(state, [offer])],
    ["purchaseListing", () => bazaarCtrl.purchaseListing(state, offer, 1)],
    ["requestWithdraw", () => bazaarCtrl.requestWithdraw(state, "chave-pix")],
    ["purchasePack", () => storeCtrl.purchasePack(state, "one-pouch")],
    ["startRest", () => characterCtrl.startRest(state)],
    ["restTick", () => characterCtrl.restTick(state)],
    ["sufferBlow", () => characterCtrl.sufferBlow(state, 12)],
    ["grantExperience", () => characterCtrl.grantExperience(state, 50)],
    ["renameCharacter", () => characterCtrl.renameCharacter(state, "Novonome")],
    [
      "nextAutomationStep",
      () => automationCtrl.nextAutomationStep(state, deepFreeze({ kind: "hunt", paused: true })),
    ],
    ["listRanking", () => rankingCtrl.listRanking(state, pit, "bronze", 1, "a", "female")],
    ["profileOf", () => rankingCtrl.profileOf(state, pit, rival.id)],
    ["addMate", () => packCtrl.addMate(state, { id: "mate-9", name: "Alguém" })],
    ["removeMate", () => packCtrl.removeMate(state, "mate-9")],
    ["addLog", () => logCtrl.addLog(state, "system", "eco")],
    ["detailInventory", () => inventoryCtrl.detailInventory(state)],
  ];
  for (const [name, call] of calls) {
    try {
      call();
      ok("does not mutate: " + name, true);
    } catch (error) {
      ok("does not mutate: " + name, false, error.message);
    }
  }
}
sec("currency and format");
{
  ok("currency says WCoin", formatBronze(120) === "120 WCoins");
  ok("currency in the singular", formatBronze(1) === "1 WCoin");
  ok("simple parse", parseReais("50") === 5000);
  ok("parse with comma", parseReais("49,90") === 4990);
  ok("parse with thousands", parseReais("1.500,00") === 150000);
  ok("garbage parse is null", parseReais("abc") === null);
  ok("negative parse is null", parseReais("-5") === null);
}
sec("persistence");
{
  const store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
  };
  const repo = load("models/repositories/game.repository.js").gameRepository;
  const KEY = CONST.STORAGE_KEY;
  const RESCUE = KEY + ":rescue";
  const put = (value) => {
    store.clear();
    store.set(KEY, typeof value === "string" ? value : json(value));
  };
  const shell = (extra) => ({
    version: 1,
    inventory: [],
    log: [],
    equipment: {},
    ...extra,
  });
  const oldCharacter = (extra) => ({
    id: "chr_velho",
    name: "Velho",
    gender: "female",
    form: "human",
    level: 10,
    experience: 5,
    health: 50,
    rage: 10,
    attributes: { strength: 8, agility: 8, endurance: 8, instinct: 8, willpower: 8 },
    trainingProgress: {},
    createdAt: "2025-01-01T00:00:00.000Z",
    ...extra,
  });
  put(shell({ character: oldCharacter({ silver: 500, bronze: undefined }) }));
  let loaded = repo.load();
  ok("old silver becomes bronze", loaded.character.bronze === 500);
  ok("the silver key dies", !("silver" in loaded.character));
  put(
    shell({
      character: oldCharacter({}),
      inventory: [{ itemId: "bronze-armor", quantity: 1 }],
      equipment: { armor: "bronze-armor" },
      enhancements: { "bronze-armor": 3 },
      bazaarListings: [
        {
          id: "bz1",
          sellerId: "chr_velho",
          sellerName: "Velho",
          itemId: "bronze-armor",
          enhancement: 3,
          quantity: 1,
          priceCents: 500,
        },
      ],
    }),
  );
  loaded = repo.load();
  ok("old coat migrates in the bag", loaded.inventory[0].itemId === "bronze-armor-female");
  ok("old coat migrates on the body", loaded.equipment.armor?.itemId === "bronze-armor-female");
  ok(
    "an old coat carries its forge to the copy and the body",
    loaded.inventory[0].enhancement === 3 && loaded.equipment.armor?.enhancement === 3,
  );
  ok("old coat migrates in the bazaar", loaded.bazaarListings[0]?.itemId === "bronze-armor-female");
  put(
    shell({
      character: oldCharacter({}),
      pet: { id: "p", name: "Lobo", gender: "male", health: 55, adoptedAt: "2025-01-01" },
    }),
  );
  loaded = repo.load();
  ok("wolf from the health era loses the health", !("health" in loaded.pet));
  ok("wolf saved without energy arrives empty", loaded.pet.energy === 0);
  ok("old wolf reads level 1", petRules.petLevelOf(loaded.pet) === 1);
  put(
    shell({
      character: oldCharacter({ level: "abc", experience: null, health: NaN }),
      mining: { level: 3 },
      wallet: { cents: NaN },
      pet: { id: "p", name: "L", gender: "male", energy: -50, level: NaN, adoptedAt: "x" },
    }),
  );
  loaded = repo.load();
  ok("rotten level becomes 1", loaded.character.level === 1);
  ok("rotten experience becomes 0", loaded.character.experience === 0);
  ok("rotten health becomes the base vital", loaded.character.health === CONST.BASE_VITAL);
  ok("mining without progress gains 0", loaded.mining.progress === 0);
  ok("old mining arrives with a full quota", loaded.mining.count === 0);
  ok("NaN wallet returns to R$ 10", loaded.wallet.cents === 1000);
  ok("negative energy becomes 0", loaded.pet.energy === 0);
  put(shell({ character: oldCharacter({}), wallet: undefined }));
  ok("save without a wallet gets R$ 10", repo.load().wallet.cents === 1000);
  put(
    shell({
      character: oldCharacter({}),
      inventory: [
        { itemId: "espada-fantasma", quantity: 2 },
        { itemId: "rabbit-fur", quantity: 1 },
      ],
      equipment: { claw: "garra-fantasma" },
      enhancements: { "espada-fantasma": 4 },
    }),
  );
  loaded = repo.load();
  ok(
    "id morto sai da mochila",
    loaded.inventory.length === 1 && loaded.inventory[0].itemId === "rabbit-fur",
  );
  ok("dead id leaves the body", loaded.equipment.claw === null);
  ok("the forge-by-id era is over", !("enhancements" in loaded));
  put("{{{isso não é json");
  loaded = repo.load();
  ok("torn json returns to the start", loaded.character === null);
  ok("torn json is rescued", store.get(RESCUE) === "{{{isso não é json");
  put(shell({ version: 99, character: oldCharacter({}) }));
  loaded = repo.load();
  ok("version from the future returns to the start", loaded.character === null);
  ok("version from the future is rescued", typeof store.get(RESCUE) === "string");
  put(
    shell({
      character: oldCharacter({}),
      arenaDuels: { "rival-1": "2026-01-01T00:00:00.000Z", "rival-2": 123 },
      automation: { hunt: true, petFeed: "sim" },
      bazaarPurchases: { good: 2, bad: "x" },
    }),
  );
  loaded = repo.load();
  ok(
    "a rotten arena stamp is discarded",
    !("rival-2" in loaded.arenaDuels) && "rival-1" in loaded.arenaDuels,
  );
  ok(
    "the automation switch survives",
    loaded.automation.hunt === true && loaded.automation.petFeed === false,
  );
  ok(
    "a rotten purchase is discarded",
    loaded.bazaarPurchases.good === 2 && !("bad" in loaded.bazaarPurchases),
  );
  const canon = (value) =>
    JSON.stringify(value, (key, entry) =>
      entry && typeof entry === "object" && !Array.isArray(entry)
        ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b)))
        : entry,
    );
  const roundtrip = factory.createRun("Ciclo", "male");
  put(json(roundtrip));
  const back = repo.load();
  ok(
    "a sound save crosses whole",
    canon({ ...back, log: [] }) === canon({ ...roundtrip, log: [] }),
  );
  delete globalThis.window;
}
console.log("");
console.log("checks: " + checks + "   failures: " + failures);
for (const problem of problems) console.log("  ✘ " + problem);
process.exit(failures > 0 ? 1 : 0);
