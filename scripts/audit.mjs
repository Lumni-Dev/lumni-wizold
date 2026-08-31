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
const { sanitizeName, normalizeText } = load("shared/utils/text.js");
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
function setMoon(key) {
  moon.applyMoonState({
    phase: moon.findMoonPhase(key),
    age: 1,
    illumination: 0,
    waxing: key === "waxing",
    source: "local",
  });
}
setMoon("new");
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
      "saúde pela fórmula NV " + level,
      derived.maxHealth ===
        Math.round(
          CONST.BASE_VITAL +
            (t.endurance - CONST.BASE_ATTRIBUTE_VALUE) * CONST.HEALTH_PER_ENDURANCE +
            level * CONST.HEALTH_PER_LEVEL,
        ),
    );
    ok(
      "esquiva na curva NV " + level,
      derived.dodge === clamp(Math.round((35 * t.agility) / (t.agility + 120)), 0, 35),
    );
    ok(
      "crítico na curva NV " + level,
      derived.critical === clamp(Math.round(5 + (40 * t.instinct) / (t.instinct + 250)), 0, 45),
    );
    const sourceSum = (key) =>
      derived.sources.trained[key] +
      derived.sources.equipment[key] +
      derived.sources.pet[key] +
      derived.sources.moon[key] +
      derived.sources.fury[key];
    for (const key of ["strength", "agility", "endurance", "instinct", "willpower"]) {
      ok("fontes somam o total (" + key + ")", sourceSum(key) === t[key]);
    }
    ok("sem buff, a fonte fúria é zero NV " + level, derived.sources.fury.strength === 0);
    const buffed = stats.deriveStatsOf(
      { level, attributes: attrs, furyActive: true },
      entItem.emptyEquipment(),
    );
    ok(
      "buff de fúria soma +" + CONST.FURY_ATTRIBUTE_BONUS + " em todos NV " + level,
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
  for (const key of Object.keys(attrs)) {
    ok(
      "lua cheia soma " + moon.FULL_MOON_ATTRIBUTE_BONUS + " em " + key,
      underFull.totalAttributes[key] ===
        underNew.totalAttributes[key] + moon.FULL_MOON_ATTRIBUTE_BONUS,
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
sec("combate");
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
      ok("vida final não negativa", outcome.finalHealth >= 0);
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
      ok("dano causado = soma das rodadas", dealt === outcome.damageDealt);
      ok("dano sofrido = soma das rodadas", taken === outcome.damageTaken);
      ok("gasto do lobo dentro do fôlego", outcome.petSpent <= petEnergy + CONST.PET_BITE_ENERGY);
      ok("lobo em casa não gasta", petEnergy > 0 || outcome.petSpent === 0);
      let lastCharacter = derived.maxHealth;
      let lastCreature = creature.health;
      let monotone = true;
      for (const round of told) {
        if (round.characterHealth > lastCharacter || round.creatureHealth > lastCreature)
          monotone = false;
        lastCharacter = round.characterHealth;
        lastCreature = round.creatureHealth;
      }
      ok("vidas nunca sobem na narração", monotone);
    }
  }
  ok("bateria rodou", fights === 2400, fights);
  ok(
    "dano do crítico é fixo, sem depender da fúria",
    combat.criticalMultiplierOf() === 1.5 + CONST.CRITICAL_DAMAGE_BONUS,
  );
}
sec("bandas e presas");
{
  const areas = territoriesData.TERRITORIES;
  ok("10 áreas", areas.length === 10);
  ok("primeira área começa em 1", areas[0].minLevel === 1);
  ok("última área termina em 1000", areas[areas.length - 1].maxLevel === 1000);
  for (let index = 0; index < areas.length; index += 1) {
    const area = areas[index];
    ok("área " + area.id + " tem 100 níveis", area.maxLevel - area.minLevel + 1 === 100);
    ok("área " + area.id + " tem 10 criaturas", area.creatures.length === 10);
    if (index > 0)
      ok(
        "área " + area.id + " vem logo após a anterior",
        area.minLevel === areas[index - 1].maxLevel + 1,
      );
  }

  const creatures = creaturesData.CREATURES;
  ok("100 criaturas", creatures.length === 100);
  ok("ids únicos", new Set(creatures.map((c) => c.id)).size === 100);

  for (const area of areas) {
    area.creatures.forEach((creatureId, slot) => {
      const creature = creaturesData.findCreature(creatureId);
      ok("criatura existe " + creatureId, Boolean(creature));
      if (creature)
        ok(
          "criatura no seu bloco de 10 " + creatureId,
          creature.level === area.minLevel + slot * 10,
        );
    });
  }

  for (const creature of creatures) {
    ok(
      "números inteiros " + creature.id,
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
    ok("bolsa mínima <= máxima " + creature.id, creature.minBronze <= creature.maxBronze);
    for (const drop of creature.drops) {
      ok("chance válida " + creature.id + "/" + drop.itemId, drop.chance > 0 && drop.chance <= 1);
      const male = items.itemIdFor(drop.itemId, "male");
      const female = items.itemIdFor(drop.itemId, "female");
      ok("drop resolve para macho " + drop.itemId, Boolean(items.findItem(male)));
      ok("drop resolve para fêmea " + drop.itemId, Boolean(items.findItem(female)));
      const dropped = items.findItem(items.itemIdFor(drop.itemId, "male"));
      ok(
        "a caça não larga equipamento " + drop.itemId,
        !entItem.EQUIPMENT_SLOTS.includes(dropped.category),
      );
    }
  }

  const ranked = [...creatures].sort((a, b) => a.level - b.level);
  let expMonotone = true;
  for (let i = 1; i < ranked.length; i += 1) {
    if (ranked[i].experience < ranked[i - 1].experience) expMonotone = false;
  }
  ok("experiência cresce com o nível", expMonotone);

  for (const definition of species.SPECIES) {
    ok("nenhuma espécie larga peça de conjunto " + definition.key, definition.gearDrops.length === 0);
  }
  let previous = 0;
  let monotone = true;
  for (let level = 1; level <= 1000; level += 1) {
    const purse = species.huntPurse(level);
    if (!isInt(purse) || purse <= 0 || purse < previous) monotone = false;
    previous = purse;
  }
  ok("bolsa da caçada é inteira, positiva e nunca cai", monotone);
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
sec("economia");
{
  for (const level of [1, 100, 340, 670, 1000]) {
    const purse = species.huntPurse(level);
    ok(
      "ponto custa 3 caçadas NV " + level,
      training.trainingPointCost(level) === Math.max(1, Math.round(purse * 3)),
    );
    const trainedValue = Math.max(1, Math.round(level * 0.55));
    ok(
      "sessão custa a fatia do ponto pelas sessões NV " + level,
      training.trainingSessionCost(level, trainedValue) ===
        Math.max(
          1,
          Math.round(
            training.trainingPointCost(level) / training.trainingSessionsPerPoint(trainedValue),
          ),
        ),
    );
    if (trainedValue > 1) {
      ok(
        "atributo mais alto exige mais sessões NV " + level,
        training.trainingSessionsPerPoint(trainedValue) >=
          training.trainingSessionsPerPoint(trainedValue - 1),
      );
    }
    for (const pack of packsData.STORE_PACKS) {
      ok(
        "pacote " + pack.id + " NV " + level + " = bolsa x caçadas",
        storeRules.packBronze(pack, level) === Math.round(purse * pack.hunts),
      );
    }
  }
  ok(
    "três pacotes de 25/125/400 caçadas",
    json(packsData.STORE_PACKS.map((pack) => pack.hunts)) === json([25, 125, 400]),
  );
  ok(
    "preços dos pacotes",
    json(packsData.STORE_PACKS.map((pack) => pack.priceCents)) === json([490, 1990, 4990]),
  );
  const setTotal = (definition) =>
    entItem.EQUIPMENT_SLOTS.reduce((total, slot) => total + sets.piecePrice(definition, slot), 0);
  ok("conjunto de bronze custa 1235", setTotal(sets.EQUIPMENT_SETS[0]) === 1235);
  let setsClimb = true;
  for (let index = 1; index < sets.EQUIPMENT_SETS.length; index += 1) {
    if (setTotal(sets.EQUIPMENT_SETS[index]) <= setTotal(sets.EQUIPMENT_SETS[index - 1])) {
      setsClimb = false;
    }
  }
  ok("o preço dos conjuntos sobe a cada banda", setsClimb);
  for (const level of [100, 340, 670, 1000]) {
    const value = Math.round(level * 0.55);
    const sessions = training.trainingSessionsPerPoint(value);
    ok(
      "treino sobe com a mesma curva do nível, atributo " + value,
      sessions === Math.ceil(progression.experienceForLevel(value) / (12 + 7 * value)),
      sessions,
    );
    const perPoint = (sessions * training.trainingSessionCost(level, value)) / species.huntPurse(level);
    ok(
      "ponto custa 1..10 caçadas NV " + level,
      perPoint >= 1 && perPoint <= 10,
      perPoint.toFixed(2),
    );
  }
  ok("renomear custa 50 mil de bronze fixos", characterCtrl.renameCost() === CONST.RENAME_PRICE);
}
sec("progressão");
{
  for (const level of [1, 25, 500, 1000]) {
    ok(
      "experiência exigida NV " + level,
      progression.experienceForLevel(level) === 50 * (level * level - 3 * level + 4),
    );
  }
  const character = baseState({ level: 5 }).character;
  const short = progression.applyExperience({ ...character, experience: 0 }, 10);
  ok("ganho curto acumula", short.character.experience === 10 && short.levelsGained === 0);
  const crossing = progression.applyExperience(
    { ...character, experience: 0 },
    progression.experienceForLevel(5) + 50,
  );
  ok(
    "cruzar o limiar sobe um nível",
    crossing.levelsGained === 1 && crossing.character.level === 6,
  );
  ok("o excedente vira o começo do próximo nível", crossing.character.experience === 50);
  const leaped = progression.applyExperience(
    { ...character, experience: 0 },
    progression.experienceForLevel(5) + progression.experienceForLevel(6) + 30,
  );
  ok(
    "um ganho gordo sobe vários níveis carregando a sobra",
    leaped.levelsGained === 2 && leaped.character.level === 7 && leaped.character.experience === 30,
  );
  const atCap = progression.applyExperience({ ...character, level: 1000, experience: 0 }, 99999999);
  ok("teto de nível segura", atCap.character.level === 1000 && atCap.levelsGained === 0);
  ok(
    "no teto a barra fica cheia",
    atCap.character.experience === progression.experienceForLevel(1000),
  );
  const negative = progression.applyExperience({ ...character, experience: 50 }, -30);
  ok("ganho negativo não rouba", negative.character.experience === 50);
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
  ok("progresso zera no ponto", raised.character.trainingProgress.strength === 0);
  const carry = progression.applyTrainingProgress(trainee, "strength", 11);
  ok(
    "o excedente do treino vira o começo do próximo ponto",
    carry.pointsGained === 1 &&
      carry.character.attributes.strength === 11 &&
      carry.character.trainingProgress.strength === 10,
  );
  const leapt = progression.applyTrainingProgress(trainee, "strength", need11 + 6);
  ok(
    "um treino gordo sobe vários pontos carregando a sobra",
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
    "atributo no teto não passa",
    maxed.character.attributes.strength === 1000 && maxed.pointsGained === 0,
  );
  ok("teto zera progresso", maxed.character.trainingProgress.strength === 0);
  const state = baseState({ level: 5 });
  setMoon("waxing");
  const waxing = characterCtrl.grantExperience(state, 100);
  setMoon("new");
  const plain = characterCtrl.grantExperience(state, 100);
  ok("crescente paga 105", waxing.granted === 105);
  ok("lua nova paga 100", plain.granted === 100);
}
sec("arena");
{
  ok("banda no chão tem largura 5", json(arena.arenaBand(1)) === json({ start: 1, end: 6 }));
  ok("banda no teto encosta em 1000", arena.arenaBand(1000).end === 1000);
  const band500 = arena.arenaBand(500);
  ok("banda de 500 tem 12%", band500.start === 440 && band500.end === 560);
  const now = Date.parse("2026-01-15T18:00:00.000Z");
  const since06 = (h, m) => new Date(Date.UTC(2026, 0, 15, h, m ?? 0)).toISOString();
  const before06 = (h) => new Date(Date.UTC(2026, 0, 14, h)).toISOString();
  ok("sem selos, dez ataques", arena.arenaCharges({}, now).left === 10);
  ok("um selo de hoje gasta um", arena.arenaCharges({ a: since06(17) }, now).left === 9);
  const spent = arena.arenaCharges(
    Object.fromEntries(Array.from({ length: 10 }, (_, i) => ["r" + i, since06(10, i)])),
    now,
  );
  ok("dez selos zeram", spent.left === 0 && spent.returnsIn > 0);
  ok("selo de ontem não conta", arena.arenaCharges({ a: before06(20) }, now).left === 10);
  ok("selo inválido não trava", arena.arenaCooldownLeft("data-podre", now) === 0);
  ok("selo de hoje descansa até as 06:00", arena.arenaCooldownLeft(since06(17), now) > 0);
  ok("selo de ontem já descansou", arena.arenaCooldownLeft(before06(20), now) === 0);
  const random = seededRandom(99);
  for (const level of [1, 100, 500, 1000]) {
    const range = arena.arenaSpoilsRange(level);
    const purse = species.huntPurse(level);
    ok(
      "faixa de espólio 1,5..3 bolsas NV " + level,
      range.min === Math.round(purse * 1.5) && range.max === Math.round(purse * 3),
    );
    for (const bag of [0, 10, range.max, 10000000]) {
      for (let trial = 0; trial < 500; trial += 1) {
        const spoils = arena.arenaSpoils(level, bag, random);
        const shareCap = Math.round((bag * 25) / 100);
        if (!(isInt(spoils) && spoils >= 0 && spoils <= range.max && spoils <= shareCap)) {
          ok("espólio dentro dos limites NV " + level + " bolsa " + bag, false, spoils);
          break;
        }
      }
    }
    ok("bolsa vazia não paga nada NV " + level, arena.arenaSpoils(level, 0, random) === 0);
  }
  const inBand = baseState({ level: 5 });
  const rival = benchHunter("pit-near", 5);
  const pit = [rival, benchHunter("pit-far", 500)];
  ok(
    "fora da banda é recusado",
    arenaCtrl.resolveArena(inBand, pit, "pit-far", random).ok === false,
  );
  ok(
    "desafiar a si mesmo é recusado",
    arenaCtrl.resolveArena(inBand, [...pit, { ...rival, id: inBand.character.id }], inBand.character.id, random).ok === false,
  );
  const cooling = { ...inBand, arenaDuels: { [rival.id]: new Date().toISOString() } };
  ok(
    "descanso até as 06:00 é recusado",
    arenaCtrl.resolveArena(cooling, pit, rival.id, random).ok === false,
  );
  const drained = {
    ...inBand,
    arenaDuels: Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => ["r" + i, new Date().toISOString()]),
    ),
  };
  ok(
    "sem ataques do dia é recusado",
    arenaCtrl.resolveArena(drained, pit, rival.id, random).ok === false,
  );
  const bleeding = { ...inBand, character: { ...inBand.character, health: 1 } };
  ok(
    "vida no chão é recusada",
    arenaCtrl.resolveArena(bleeding, pit, rival.id, random).ok === false,
  );
  const duel = arenaCtrl.resolveArena(inBand, pit, rival.id, seededRandom(7));
  ok("duelo válido resolve", duel.ok === true);
  if (duel.ok) {
    const landed = arenaCtrl.landArena(inBand, duel.data, 0);
    const before = inBand.character;
    const after = landed.state.character;
    ok(
      "bronze muda exatamente o espólio",
      after.bronze === Math.max(0, before.bronze + duel.data.spoils),
    );
    ok("selo do rival é gravado", typeof landed.state.arenaDuels[rival.id] === "string");
    ok(
      "contador certo",
      duel.data.combat.victory
        ? after.arenaWins === before.arenaWins + 1
        : duel.data.combat.retreated
          ? after.arenaWins === before.arenaWins && after.arenaLosses === before.arenaLosses
          : after.arenaLosses === before.arenaLosses + 1,
    );
    ok("empate não move bronze", duel.data.combat.retreated ? duel.data.spoils === 0 : true);
    ok(
      "experiência não vem do fosso",
      after.experience === before.experience && after.level === before.level,
    );

    const beaten = {
      ...duel.data,
      combat: { ...duel.data.combat, victory: false, retreated: false },
      spoils: 0,
    };
    const humbled = arenaCtrl.landArena(inBand, beaten, 0);
    ok(
      "derrota conta uma perda no fosso",
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
  ok("mascote do desafiante morde no fosso", packDuel.ok && packDuel.data.combat.petSpent > 0);
  ok(
    "mascote do rival morde no fosso",
    packDuel.ok && packDuel.data.combat.rounds.some((round) => round.text.includes("Brasa")),
  );
  if (packDuel.ok) {
    const packLanded = arenaCtrl.landArena(packState, packDuel.data, 0);
    ok(
      "fôlego do mascote pousa no duelo",
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
    "lobo sem fôlego fica fora do fosso",
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
  ok("empate é empate dos dois lados", told[2].outcome === "draw");
}
sec("caçada");
{
  const random = seededRandom(2024);
  const state = baseState({ level: 170 });
  state.equipment.claw = { itemId: "silver-claw", enhancement: 0 };
  const weak = { ...state, character: { ...state.character, health: 1 } };
  ok("vida no chão não caça", huntCtrl.resolveHunt(weak, "dew-woods", random).ok === false);
  ok(
    "toda área é aberta: a faixa virou só sugestão",
    huntCtrl.resolveHunt(state, "white-clearing", random).ok === true,
  );
  ok("território desconhecido recusa", huntCtrl.resolveHunt(state, "nada", random).ok === false);
  const resolved = huntCtrl.resolveHunt(state, "dew-woods", random);
  ok("caçada válida resolve", resolved.ok === true);
  const picked = huntCtrl.resolveHunt(state, "dew-woods", random, "young-bear");
  ok(
    "a caçada enfrenta o bicho escolhido pelo id",
    picked.ok === true && picked.data.creature.id === "young-bear",
  );
  if (resolved.ok) {
    const beaten = {
      ...resolved.data,
      combat: { ...resolved.data.combat, victory: false, retreated: false },
      bronze: 0,
      drops: [],
    };
    const humbledHunt = huntCtrl.landHunt(state, beaten, 0);
    ok(
      "derrota na caçada conta uma perda",
      humbledHunt.state.character.losses === state.character.losses + 1,
    );

    const landed = huntCtrl.landHunt(state, resolved.data, 0);
    const before = state.character;
    const after = landed.state.character;
    const derived = stats.deriveStats(before, state.equipment, state.pet);
    ok("bronze soma o saque", after.bronze === before.bronze + resolved.data.bronze);
    ok("caçadas contam", after.hunts === before.hunts + 1);
    ok(
      "vida desce o que a luta tirou",
      after.health ===
        clamp(Math.max(1, before.health - resolved.data.healthLost), 0, derived.maxHealth),
    );
    ok(
      "sangue já derramado não desconta duas vezes",
      huntCtrl.landHunt(state, resolved.data, resolved.data.healthLost).state.character.health ===
        before.health,
    );
    for (const drop of resolved.data.drops) {
      ok(
        "saque no inventário " + drop.itemId,
        inventoryCtrl.countInInventory(landed.state.inventory, drop.itemId) >= drop.quantity,
      );
    }
  }
  const inGap = baseState({ level: 167, form: "werewolf" });
  const gapView = huntCtrl
    .listTerritories(inGap)
    .find((entry) => entry.territory.id === "village-field");
  const topOfArea1 = creaturesData.findCreature("forest-lynx");
  ok("a presa é a variante mais forte destravada", gapView.prey.name === "Lince do Mato");
  ok("a presa fixa não escala com o nível do caçador", gapView.prey.health === topOfArea1.health);
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
      "fôlego desce em uma subtração",
      landed.state.pet.energy ===
        clamp(100 - petHunt.data.combat.petSpent, 0, petRules.petMaxEnergy(1)),
    );
    ok(
      "o lobo que caça não aprende, só treina",
      landed.state.pet.trainingProgress === 0 && landed.state.pet.level === 1,
    );
  }
  const shortWind = {
    ...withPet,
    pet: { ...withPet.pet, energy: CONST.PET_ENERGY_PER_HUNT + CONST.PET_ENERGY_PER_BLOW - 1 },
  };
  const shortHunt = huntCtrl.resolveHunt(shortWind, "village-field", seededRandom(6));
  ok(
    "lobo sem fôlego fica fora da caçada",
    shortHunt.ok && shortHunt.data.combat.petSpent === 0 && shortHunt.data.combat.petBlows === 0,
  );
  if (shortHunt.ok) {
    const shortLanded = huntCtrl.landHunt(shortWind, shortHunt.data, 0);
    ok(
      "lobo fora da luta não aprende",
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
  ok("lobo com fôlego justo entra na luta", firstHunt.ok && firstHunt.data.combat.petSpent > 0);
  if (firstHunt.ok) {
    const afterOne = huntCtrl.landHunt(oneMore, firstHunt.data, 0);
    ok(
      "a caçada esgota o fôlego do lobo",
      afterOne.state.pet.energy < CONST.PET_ENERGY_PER_HUNT + CONST.PET_ENERGY_PER_BLOW,
    );
    const rested = { ...afterOne.state, character: { ...afterOne.state.character, health: 100 } };
    const nextHunt = huntCtrl.resolveHunt(rested, "village-field", seededRandom(10));
    ok(
      "no recomeço o lobo esgotado fica de fora",
      nextHunt.ok && nextHunt.data.combat.petSpent === 0 && nextHunt.data.combat.petBlows === 0,
    );
  }
  const homePet = { ...withPet, pet: { ...withPet.pet, active: false } };
  const homeHunt = huntCtrl.resolveHunt(homePet, "village-field", seededRandom(5));
  if (homeHunt.ok) {
    const landed = huntCtrl.landHunt(homePet, homeHunt.data, 0);
    ok(
      "lobo em casa não gasta nem aprende",
      landed.state.pet.energy === 100 && (landed.state.pet.trainingProgress ?? 0) === 0,
    );
  }
}
sec("treinamento");
{
  const state = baseState({ level: 100 });
  const broke = { ...state, character: { ...state.character, bronze: 0 } };
  ok("sem bronze não treina", trainingCtrl.train(broke, "trunk-punches").ok === false);
  ok("exercício desconhecido recusa", trainingCtrl.train(state, "nada").ok === false);
  const maxed = {
    ...state,
    character: {
      ...state.character,
      attributes: { ...state.character.attributes, strength: 1000 },
    },
  };
  ok("atributo no teto recusa", trainingCtrl.train(maxed, "trunk-punches").ok === false);
  const session = trainingCtrl.train(state, "trunk-punches");
  ok("sessão válida treina", session.ok === true);
  if (session.ok) {
    const cost = training.trainingSessionCost(100, state.character.attributes.strength);
    ok(
      "cada sessão cobra na hora",
      session.state.character.bronze === state.character.bronze - cost,
    );
    const gained =
      session.state.character.trainingProgress.strength > 0 ||
      session.state.character.attributes.strength > state.character.attributes.strength;
    ok("sessão rende progresso", gained);
    const second = trainingCtrl.train(session.state, "trunk-punches");
    const secondCost = training.trainingSessionCost(100, session.state.character.attributes.strength);
    ok(
      "a sessão seguinte cobra de novo",
      second.ok && second.state.character.bronze === session.state.character.bronze - secondCost,
    );
  }
  ok(
    "cada exercício treina um atributo",
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
  ok("sessão do lobo funciona", petSession.ok === true);
  if (petSession.ok) {
    const cost = petRules.petTrainingSessionCost(1, 100);
    ok(
      "sessão do lobo cobra na hora",
      petSession.state.character.bronze === withPet.character.bronze - cost,
    );
    ok(
      "lobo progride",
      (petSession.state.pet.trainingProgress ?? 0) > 0 || petSession.state.pet.level > 1,
    );
  }
  const petMaxed = { ...withPet, pet: { ...withPet.pet, level: 1000 } };
  ok("lobo no teto recusa", petCtrl.trainPet(petMaxed).ok === false);
}
sec("mascote");
{
  ok("fôlego base", petRules.petMaxEnergy(1) === 100);
  ok("fôlego cresce 4 por nível", petRules.petMaxEnergy(100) === 100 + 99 * 4);
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
    "o excedente do treino do lobo vira o começo do próximo nível",
    grown.leveled && grown.pet.level === 6 && grown.pet.trainingProgress === 10,
  );
  ok(
    "bônus começa em 5",
    json(petRules.petLevelBonus(1)) ===
      json({ strength: 5, agility: 5, endurance: 0, instinct: 5, willpower: 0 }),
  );
  ok("bônus soma 1 por nível", petRules.petLevelBonus(10).strength === 14);
  const sleeping = { id: "p", name: "L", gender: "male", energy: 0, active: true, adoptedAt: "" };
  ok(
    "sem fôlego não empresta nada",
    json(petRules.petBonus(sleeping)) ===
      json({ strength: 0, agility: 0, endurance: 0, instinct: 0, willpower: 0 }),
  );
  const home = { ...sleeping, energy: 50, active: false };
  ok("em casa não empresta nada", petRules.petBonus(home).strength === 0);
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
  ok("repouso enche em 10 minutos", ticks === 10, ticks);
  ok(
    "gasto além do fôlego trava no zero",
    petRules.spendPetEnergy({ ...pet, energy: 3 }, 50).energy === 0,
  );
  ok(
    "comida além do teto trava no teto",
    petRules.restPet({ ...pet, energy: 100 }, 9999).energy === petRules.petMaxEnergy(5),
  );
  const state = baseState({ level: 10 });
  state.pet = { ...pet, energy: 10, active: true };
  state.inventory = [...state.inventory, { itemId: "pet-ration", quantity: 2, enhancement: 0 }];
  const fed = petCtrl.feedPet(state, "pet-ration");
  ok(
    "ração devolve metade do teto",
    fed.ok && fed.state.pet.energy === 10 + Math.round(petRules.petMaxEnergy(5) * 0.5),
  );
  ok(
    "ração sai da mochila",
    fed.ok && inventoryCtrl.countInInventory(fed.state.inventory, "pet-ration") === 1,
  );
  const whole = { ...state, pet: { ...state.pet, energy: petRules.petMaxEnergy(5) } };
  ok("lobo inteiro recusa comida", petCtrl.feedPet(whole, "pet-ration").ok === false);
  ok("consumir ração cai no mascote", inventoryCtrl.consumeItem(state, "pet-ration").ok === true);
  const active = { ...state };
  ok("repouso exige lobo em casa", petCtrl.restPetTick(active).ok === false);
  const kennel = petCtrl.setPetActive(active, false);
  ok("mandar para casa funciona", kennel.ok === true);
  if (kennel.ok) {
    const tick = petCtrl.restPetTick(kennel.state);
    ok("tique de repouso rende", tick.ok && tick.state.pet.energy > 10);
  }
  const young = petCtrl.adoptPet(
    { ...baseState({ level: CONST.PET_MIN_LEVEL - 1 }), pet: null },
    "female",
    "Neve",
  );
  ok("adoção recusa antes do NV mínimo", young.ok === false);
  const adoptLevel = CONST.PET_MIN_LEVEL;
  const adopt = petCtrl.adoptPet(
    { ...baseState({ level: adoptLevel }), pet: null },
    "female",
    "Neve",
  );
  ok(
    "adoção cobra o preço fixo do lobo",
    adopt.ok &&
      adopt.state.character.bronze ===
        baseState({ level: adoptLevel }).character.bronze - CONST.PET_PRICE,
  );
  ok("segunda adoção recusa", petCtrl.adoptPet(adopt.state, "male", "Outro").ok === false);
  const released = petCtrl.releasePet(adopt.state);
  ok(
    "soltar não devolve bronze",
    released.ok && released.state.character.bronze === adopt.state.character.bronze,
  );
}
sec("forja e mina");
{
  let forgeCostOk = true;
  for (let level = 1; level <= 1000; level += 1) {
    if (
      forgeRules.enhancementCost(level) !==
      Math.max(1, Math.round((50 * (level * level - 3 * level + 4)) / 2))
    ) {
      forgeCostOk = false;
      break;
    }
  }
  ok("custo de forja segue metade da curva (2.050.000 no teto)", forgeCostOk);
  const claw = items.findItem("lunar-claw");
  const forged = forgeRules.enhancedEffect(claw, 100);
  const base = claw.effect.attributes.strength;
  ok(
    "forja multiplica a peça (0,3% por nível, sem termo fixo)",
    forged.attributes.strength === Math.round(base * (1 + 0.003 * 100)),
  );
  ok("forja zero devolve o efeito puro", forgeRules.enhancedEffect(claw, 0) === claw.effect);
  const state = baseState({ level: 1 });
  state.inventory = [
    ...state.inventory,
    { itemId: "bronze-claw", quantity: 1, enhancement: 4 },
    { itemId: "bronze-fragment", quantity: 500, enhancement: 0 },
  ];
  const strikeFee = forgeRules.forgeBronzeCost(state.character.level, 4);
  const enhanced = forgeCtrl.enhance(state, "bronze-claw", 4, () => 0);
  ok(
    "martelada certeira sobe um nível",
    enhanced.ok && inventoryCtrl.countInInventory(enhanced.state.inventory, "bronze-claw", 5) === 1,
  );
  ok(
    "martelada certeira consome a cópia antiga",
    enhanced.ok && inventoryCtrl.countInInventory(enhanced.state.inventory, "bronze-claw", 4) === 0,
  );
  ok("martelada certeira responde raised", enhanced.ok && enhanced.data.raised === true);
  ok(
    "forja consome o fragmento do conjunto",
    enhanced.ok &&
      inventoryCtrl.countInInventory(enhanced.state.inventory, "bronze-fragment") ===
        500 - forgeRules.enhancementCost(5),
  );
  ok(
    "martelada cobra bronze",
    enhanced.ok && enhanced.state.character.bronze === state.character.bronze - strikeFee,
  );
  const missed = forgeCtrl.enhance(state, "bronze-claw", 4, () => 0.99);
  ok(
    "martelada falha mantém o nível",
    missed.ok &&
      inventoryCtrl.countInInventory(missed.state.inventory, "bronze-claw", 4) === 1 &&
      missed.data.raised === false,
  );
  ok(
    "martelada falha ainda consome fragmentos",
    missed.ok &&
      inventoryCtrl.countInInventory(missed.state.inventory, "bronze-fragment") ===
        500 - forgeRules.enhancementCost(5),
  );
  ok(
    "martelada falha também paga o ferreiro",
    missed.ok && missed.state.character.bronze === state.character.bronze - strikeFee,
  );
  const broke = { ...state, character: { ...state.character, bronze: strikeFee - 1 } };
  ok(
    "sem bronze a bigorna recusa",
    forgeCtrl.enhance(broke, "bronze-claw", 4, () => 0).ok === false,
  );
  ok(
    "a martelada encarece com a peça e com a banda",
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
    "fragmento de outro conjunto não serve",
    forgeCtrl.enhance(wrongFragments, "bronze-claw", 4).ok === false,
  );
  ok(
    "cópia fora da mochila não forja",
    forgeCtrl.enhance(state, "bronze-claw", 7).ok === false,
  );
  ok(
    "a bigorna lista a cópia da mochila",
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
    "teto da mineração é o teto do personagem",
    oresData.MINING_MAX_LEVEL === CONST.MAX_CHARACTER_LEVEL,
  );
  ok(
    "veia pede o nível de mineração da banda",
    ores.map((ore) => ore.requiredLevel).join(",") === "1,201,401,601,801",
  );
  for (const ore of ores) {
    ok("veia " + ore.id + " tem fragmento real", Boolean(items.findItem(ore.fragmentId)));
  }
  const miner = { ...baseState({ level: 1 }), mining: { level: 1, progress: 0 } };
  ok("veia funda recusa", forgeCtrl.mine(miner, "lunar-vein", seededRandom(1)).ok === false);
  const swing = forgeCtrl.mine(miner, "bronze-vein", seededRandom(1));
  ok(
    "golpe rende fragmentos",
    swing.ok && inventoryCtrl.countInInventory(swing.state.inventory, "bronze-fragment") >= 1,
  );
  ok("golpe avança a escada", swing.ok && swing.state.mining.progress === miningRules.miningEffort(1));
  const deep = { ...miner, mining: { level: 40, progress: 0 } };
  const bonusSwing = forgeCtrl.mine(deep, "bronze-vein", seededRandom(2));
  const bonus = miningRules.miningYieldBonus(40);
  ok(
    "rendimento multiplica a cada 40 níveis",
    miningRules.miningYieldBonus(20) === 1 &&
      miningRules.miningYieldBonus(40) === 2 &&
      miningRules.miningYieldBonus(80) === 3,
  );
  ok(
    "golpe fundo rende no múltiplo do bônus",
    bonusSwing.ok &&
      inventoryCtrl.countInInventory(bonusSwing.state.inventory, "bronze-fragment") % bonus === 0,
  );
  const noon = 1_700_000_000_000;
  const period = miningRules.miningPeriodStart(noon);
  const fresh = { ...baseState({ level: 1 }), mining: { level: 1, progress: 0, count: 0 } };
  const firstSwing = forgeCtrl.mine(fresh, "bronze-vein", seededRandom(1), noon);
  ok(
    "uma mineração conta uma da cota",
    firstSwing.ok && firstSwing.state.mining.count === 1,
  );
  ok(
    "o reset é o mesmo instante para todos: 09:00 UTC (06:00 São Paulo)",
    new Date(period).getUTCHours() === CONST.MINING_RESET_HOUR_UTC && noon - period < 24 * 60 * 60 * 1000,
  );
  ok(
    "o próximo reset cai dentro de um dia",
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
    "passadas as 06:00, o período novo zera a cota",
    reopened.ok && reopened.state.mining.count === 1,
  );
  const preserved = miningRules.applyMiningProgress(
    { level: 1, progress: 0, windowStart: "2020-01-01T00:00:00.000Z", count: 42 },
    10,
  );
  ok(
    "o progresso preserva o período e a cota do dia",
    preserved.mining.count === 42 &&
      preserved.mining.windowStart === "2020-01-01T00:00:00.000Z",
  );
  ok(
    "a listagem expõe a cota restante do dia",
    forgeCtrl.listMining(fresh, noon).dailyRemaining === CONST.MINING_DAILY_MININGS &&
      forgeCtrl.listMining(spent, noon).dailyExhausted === true,
  );
}
sec("bazar");
{
  ok("taxa da casa é 10%", bazaarRules.feeOf(1000) === 100 && bazaarRules.sellerNet(1000) === 900);
  ok("saque mínimo é R$ 100", bazaarRules.MIN_WITHDRAW_CENTS === 10000);
  ok("carteira nova tem R$ 10", factory.createRun("Novo", "male").wallet.cents === 1000);
  const fragment = items.findItem("bronze-fragment");
  const plain = items.findItem("bronze-claw");
  const material = items.findItem("wolf-pelt");
  ok("fragmento entra no bazar", bazaarRules.checkTrade(fragment, 0).tradable === true);
  ok("peça forjada entra", bazaarRules.checkTrade(plain, 1).tradable === true);
  ok("peça lisa de mercado não entra", bazaarRules.checkTrade(plain, 0).tradable === false);
  ok("material de caça não entra", bazaarRules.checkTrade(material, 0).tradable === false);
  const state = baseState({ level: 1 });
  state.inventory = [
    ...state.inventory,
    { itemId: "bronze-claw", quantity: 1, enhancement: 2 },
    { itemId: "bronze-fragment", quantity: 30, enhancement: 0 },
  ];
  const tooCheap = bazaarCtrl.announceListing(state, "bronze-fragment", 5, 50);
  ok("anúncio abaixo do mínimo recusa", tooCheap.ok === false);
  const tooMany = bazaarCtrl.announceListing(state, "bronze-fragment", 99, 500);
  ok("anúncio além da mochila recusa", tooMany.ok === false);
  const announced = bazaarCtrl.announceListing(state, "bronze-fragment", 10, 500);
  ok(
    "anúncio tira da mochila",
    announced.ok &&
      inventoryCtrl.countInInventory(announced.state.inventory, "bronze-fragment") === 20,
  );
  ok(
    "anúncio cobra a taxa em bronze",
    announced.ok &&
      announced.state.character.bronze ===
        state.character.bronze - bazaarRules.BAZAAR_LISTING_FEE,
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
    "anúncio vence em sete dias",
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
      "o dono ainda vê o próprio anúncio vencido",
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
  ok("compra lembra o anúncio", bought.ok && bought.state.bazaarPurchases[offer.id] === 1);
  ok(
    "forja maior viaja com a peça",
    bought.ok &&
      inventoryCtrl.countInInventory(bought.state.inventory, "gold-claw", offer.enhancement) === 1,
  );
  ok(
    "compra grava a insígnia do bazar",
    bought.ok && bought.state.bazaarFinds.includes("gold-claw"),
  );
  ok("além do anúncio recusa", bazaarCtrl.purchaseListing(rich, offer, 3).ok === false);
  const low = baseState({ level: 1 });
  ok(
    "compra respeita o nível",
    goldClaw.minLevel > 1 && bazaarCtrl.purchaseListing(low, offer, 1).ok === false,
  );
  const poor = { ...state, wallet: { cents: 9999 } };
  ok(
    "saque abaixo do piso recusa",
    bazaarCtrl.requestWithdraw(poor, "chave-pix-valida").ok === false,
  );
  const flush = { ...state, wallet: { cents: 10000 } };
  const withdrawn = bazaarCtrl.requestWithdraw(flush, "chave-pix-valida");
  ok("saque esvazia o alforje", withdrawn.ok && withdrawn.state.wallet.cents === 0);
  ok("chave curta recusa", bazaarCtrl.requestWithdraw(flush, "abc").ok === false);
}
sec("lua");
{
  const month = moon.SYNODIC_MONTH_DAYS;
  const seen = [];
  for (let age = 0; age < month; age += 0.01) {
    const key = moon.phaseFromAge(age).key;
    if (seen[seen.length - 1] !== key) seen.push(key);
  }
  ok("as fases giram na ordem", json(seen) === json(["new", "waxing", "full", "waning", "new"]));
  const window = month / 8;
  ok(
    "janela da cheia tem ~3,7 dias",
    moon.phaseFromAge(month / 2 - window / 2 + 0.01).key === "full" &&
      moon.phaseFromAge(month / 2 + window / 2 - 0.01).key === "full" &&
      moon.phaseFromAge(month / 2 + window / 2 + 0.01).key === "waning",
  );
  ok("idade negativa não quebra", Number.isFinite(moon.computeMoonLocally(0).age));
  setMoon("full");
  ok("cheia não paga experiência", moon.withMoonBonus(100) === 100);
  ok("cheia paga corpo", moon.moonAttributeBonus() === moon.FULL_MOON_ATTRIBUTE_BONUS);
  setMoon("waxing");
  ok("crescente paga 5%", moon.withMoonBonus(100) === 105);
  ok("crescente não paga corpo", moon.moonAttributeBonus() === 0);
  setMoon("new");
}
sec("inventário e mercado");
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
      ok("conservação da mochila no passo " + step, false, id2);
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
    "compra desconta o preço",
    bought.ok && bought.state.character.bronze === state.character.bronze - clawPrice,
  );
  ok("peça em dupla agora entra", marketCtrl.buyItem(state, "bronze-claw", 2).ok === true);
  ok(
    "peça já na mochila agora entra",
    bought.ok && marketCtrl.buyItem(bought.state, "bronze-claw", 1).ok === true,
  );
  ok(
    "poção compra em quantidade",
    marketCtrl.buyItem(state, "health-potion-small", 3).ok === true,
  );
  const maleCoat = marketCtrl.buyItem(state, "bronze-armor-male", 1);
  ok("Luna não compra casaco de Lumni", maleCoat.ok === false);
  const femaleCoat = marketCtrl.buyItem(state, "bronze-armor-female", 1);
  ok("Luna compra o casaco dela", femaleCoat.ok === true);
  if (femaleCoat.ok) {
    ok(
      "Luna veste o casaco dela",
      inventoryCtrl.equipItem(femaleCoat.state, "bronze-armor-female").ok === true,
    );
  }
  const highSet = marketCtrl.buyItem(state, "lunar-claw", 1);
  ok("mercado respeita o nível", highSet.ok === false);
  ok("ração sem lobo recusa", marketCtrl.buyItem(state, "pet-ration", 1).ok === false);
  ok(
    "poção pequena custa três caçadas do nível",
    marketCtrl.marketPriceOf(items.findItem("health-potion-small"), 100) ===
      Math.round(species.huntPurse(100) * 3),
  );
  ok(
    "poção grande custa doze caçadas",
    marketCtrl.marketPriceOf(items.findItem("health-potion-large"), 100) ===
      Math.round(species.huntPurse(100) * 12),
  );
  ok(
    "ração custa uma caçada e meia",
    marketCtrl.marketPriceOf(items.findItem("pet-ration"), 100) ===
      Math.max(1, Math.round(species.huntPurse(100) * 1.5)),
  );
  ok(
    "equipamento mantém o preço fixo do catálogo",
    marketCtrl.marketPriceOf(items.findItem("bronze-claw"), 100) ===
      items.findItem("bronze-claw").price,
  );
  const fragmentSale = marketCtrl.sellItem(
    { ...state, inventory: [{ itemId: "bronze-fragment", quantity: 5, enhancement: 0 }] },
    "bronze-fragment",
    1,
  );
  ok("fragmento não se vende por bronze", fragmentSale.ok === false);
  const sale = marketCtrl.sellItem(
    { ...state, inventory: [{ itemId: "rabbit-fur", quantity: 5, enhancement: 0 }] },
    "rabbit-fur",
    2,
  );
  const fur = items.findItem("rabbit-fur");
  ok(
    "venda paga metade",
    sale.ok &&
      sale.state.character.bronze ===
        state.character.bronze + Math.max(1, Math.round(fur.price * 0.5)) * 2,
  );
  const dressed = inventoryCtrl.equipItem(bought.state, "bronze-claw");
  ok(
    "equipar tira da mochila",
    dressed.ok &&
      inventoryCtrl.countInInventory(dressed.state.inventory, "bronze-claw") === 0 &&
      dressed.state.equipment.claw &&
      dressed.state.equipment.claw.itemId === "bronze-claw",
  );
  ok(
    "peça no corpo deixa comprar outra cópia",
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
    "trocar pela mesma peça conserva",
    swapped.ok && inventoryCtrl.countInInventory(swapped.state.inventory, "bronze-claw") === 1,
  );
  const potion = inventoryCtrl.consumeItem(
    { ...state, inventory: [{ itemId: "health-potion-small", quantity: 1, enhancement: 0 }] },
    "health-potion-small",
  );
  ok("poção sem ferida recusa", potion.ok === false);
  const hurt = {
    ...state,
    character: { ...state.character, health: 1 },
    inventory: [{ itemId: "health-potion-small", quantity: 1, enhancement: 0 }],
  };
  const healed = inventoryCtrl.consumeItem(hurt, "health-potion-small");
  const derived = stats.deriveStats(state.character, state.equipment, null);
  ok(
    "poção cura 25% do teto",
    healed.ok &&
      healed.state.character.health ===
        Math.min(derived.maxHealth, 1 + Math.round(derived.maxHealth * 0.25)),
  );
  const store = storeCtrl.purchasePack(state, "two-pouches");
  ok(
    "pacote credita a bolsa da loja",
    store.ok &&
      store.state.character.bronze ===
        state.character.bronze + storeRules.packBronze(packsData.STORE_PACKS[1], 1),
  );
}
sec("nomes");
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
    ok("sanitize idempotente: " + json(raw), sanitizeName(clean, CONST.NAME_MAX_LENGTH) === clean);
    ok("sem espaço nem sinal: " + json(raw), /^[\p{L}\p{M}\p{N}]*$/u.test(clean));
    ok("até 25: " + json(raw), clean.length <= 25);
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
  ok("espaço é recusado", characterCtrl.validateName("dois nomes") !== null);
  ok("curto é recusado", characterCtrl.validateName("ab") !== null);
  ok("número entra", characterCtrl.validateName("Lobo77") === null);
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
  ok("posições 1..25", board[0].position === 1 && board[24].position === 25);
  let sorted = true;
  for (let index = 1; index < board.length; index += 1) {
    if (board[index].value > board[index - 1].value) sorted = false;
  }
  ok("quadro ordena do maior para o menor", sorted);
  const state = baseState({ level: 500 });
  const view = rankingCtrl.listRanking(state, roster, "level", 1);
  ok("jogador entra no quadro", view.playerPosition !== null && view.boardSize === 26);
  const searched = rankingCtrl.listRanking(state, roster, "level", 1, "Teste");
  ok("busca acha o jogador", searched.total >= 1);
  ok(
    "busca preserva a posição verdadeira",
    searched.entries.find((entry) => entry.isPlayer)?.position === view.playerPosition,
  );
  const cut = rankingCtrl.listRanking(state, roster, "level", 1, "", "female");
  ok(
    "corte por gênero filtra sem renumerar",
    cut.entries.length > 0 &&
      cut.entries.every((entry) => entry.hunter.gender === "female") &&
      cut.entries.every(
        (entry) => board.find((line) => line.hunter.id === entry.hunter.id)?.position !== undefined,
      ),
  );
  const wolfBoard = entRanking.findBoard("pet");
  ok(
    "quadro do mascote lê o nível do lobo",
    wolfBoard.key === "pet" &&
      wolfBoard.value({
        ...roster[0],
        pet: { name: "Lobo", gender: "male", level: 7, energy: 50, active: true },
      }) === 7,
  );
  ok("sem lobo o quadro do mascote lê zero", wolfBoard.value(roster[0]) === 0);
  const profile = rankingCtrl.profileOf(state, roster, "bench-0");
  ok("perfil de outro caçador abre", profile !== null && profile.positions.length === 12);
  ok("perfil sem NaN", profile !== null && Number.isFinite(profile.stats.maxHealth));
  const own = rankingCtrl.profileOf(state, roster, state.character.id);
  ok("a própria ficha se reconhece", own !== null && own.isPlayer === true);
  const empty = rankingCtrl.listRanking(state, [], "level", 1);
  ok(
    "quadro vazio ainda mostra o jogador",
    empty.boardSize === 1 && empty.playerPosition === 1,
  );
}
sec("personagem");
{
  const run = factory.createRun("Luna", "female");
  const derived = stats.deriveStats(run.character, run.equipment, null);
  ok(
    "nasce inteiro",
    run.character.health === derived.maxHealth && run.character.rage === derived.maxRage,
  );
  ok("nasce com 100 de bronze", run.character.bronze === CONST.STARTING_BRONZE);
  ok(
    "nasce sem equipamento",
    Object.values(run.equipment).every((slot) => slot === null),
  );
  ok("nasce no nível 1", run.character.level === 1);
  ok(
    "linhagem soma o bônus dela",
    run.character.attributes.agility === 9 && run.character.attributes.strength === 4,
  );
  const state = baseState({ level: 10 });

  const withPotion = {
    ...state,
    inventory: [{ itemId: "rage-potion-small", quantity: 1, enhancement: 0 }],
  };
  const drank = inventoryCtrl.consumeItem(withPotion, "rage-potion-small");
  ok("poção de fúria vira buff", drank.ok && typeof drank.state.character.furyUntil === "string");
  ok("o buff está ativo agora", Date.parse(drank.state.character.furyUntil) > Date.now());
  const buffedStats = stats.deriveStats(drank.state.character, drank.state.equipment, null);
  const plainStats = stats.deriveStats(state.character, state.equipment, null);
  ok(
    "o buff levanta a Força em " + CONST.FURY_ATTRIBUTE_BONUS,
    buffedStats.totalAttributes.strength ===
      plainStats.totalAttributes.strength + CONST.FURY_ATTRIBUTE_BONUS,
  );
  ok("a poção de fúria não devolve vida", drank.state.character.health === state.character.health);

  const bloated = { ...state, character: { ...state.character, health: 99999 } };
  const squeezed = characterCtrl.syncCharacter(bloated);
  const ceiling = stats.deriveStats(state.character, state.equipment, null);
  ok("teto encolhido aperta a vida", squeezed.character.health === ceiling.maxHealth);
  ok("corpo em dia não troca referência", characterCtrl.syncCharacter(state) === state);

  const tired = { ...state, character: { ...state.character, health: 50 } };
  const resting = characterCtrl.startRest(tired);
  ok("repousar quando ferido é permitido", resting.ok);
  const tick = characterCtrl.restTick(resting.state);
  const max = stats.deriveStats(resting.state.character, state.equipment, null).maxHealth;
  ok(
    "o tique devolve vida pelo passo do descanso",
    tick.ok &&
      tick.state.character.health ===
        Math.min(max, 50 + Math.max(1, Math.ceil(max * CONST.REST_HEALTH_RATIO))),
  );
  const whole = baseState({ level: 10 });
  ok("inteiro não repousa", characterCtrl.startRest(whole).ok === false);
  const blow = characterCtrl.sufferBlow(state, 40);
  ok("golpe narrado sangra por fora", blow.state.character.health === state.character.health - 40);
  const lethal = characterCtrl.sufferBlow(state, 999999);
  ok("golpe narrado nunca mata", lethal.state.character.health === 1);
  const spam = Array.from({ length: 130 }).reduce(
    (current) => logCtrl.addLog(current, "system", "eco"),
    state,
  );
  ok("diário guarda no máximo 120", spam.log.length <= CONST.LOG_LIMIT);
}
sec("automação");
{
  const quiet = baseState({ level: 10 });
  ok("tudo desligado, nada acontece", automationCtrl.nextAutomationStep(quiet, null) === null);
  const low = baseState({ level: 10 });
  const floor = stats.deriveStats(low.character, low.equipment, null).maxHealth;
  low.character.health = Math.max(1, Math.floor(floor * 0.1));
  ok(
    "ferido bebe sozinho ao zerar, sem chave",
    automationCtrl.nextAutomationStep(low, null)?.kind === "potion",
  );
  const bareFloor = { ...low, inventory: [] };
  ok(
    "ferido sem poção deita sozinho, sem chave",
    automationCtrl.nextAutomationStep(bareFloor, null)?.kind === "rest",
  );
  const withPotion = { ...low, automation: { ...low.automation, potion: true } };
  const step = automationCtrl.nextAutomationStep(withPotion, null);
  ok("ferido bebe a menor poção", step?.kind === "potion" && step.itemId === "health-potion-small");
  const noFlask = {
    ...withPotion,
    inventory: [],
    automation: { ...low.automation, potion: true, rest: true },
  };
  ok("sem poção, deita", automationCtrl.nextAutomationStep(noFlask, null)?.kind === "rest");
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
  ok("lobo vazio come sozinho", automationCtrl.nextAutomationStep(fed, null)?.kind === "feed");
  const noRation = {
    ...petState,
    inventory: [],
    automation: { ...petState.automation, petRest: true },
  };
  const kennel = automationCtrl.nextAutomationStep(noRation, null);
  ok("sem comida vai para casa", kennel?.kind === "kennel" && kennel.active === false);
  const restedPet = {
    ...petState,
    pet: { ...petState.pet, energy: 100, active: false },
    automation: { ...petState.automation, petRest: true },
  };
  const called = automationCtrl.nextAutomationStep(restedPet, null);
  ok("cheio volta para a caçada", called?.kind === "kennel" && called.active === true);
  const shortPetState = {
    ...petState,
    pet: {
      ...petState.pet,
      energy: CONST.PET_ENERGY_PER_HUNT + CONST.PET_ENERGY_PER_BLOW - 1,
    },
    automation: { ...petState.automation, petFeed: true },
  };
  ok(
    "lobo sem fôlego come antes de zerar",
    automationCtrl.nextAutomationStep(shortPetState, null)?.kind === "feed",
  );
  const restKeyOnly = { ...petState, automation: { ...petState.automation, petRest: true } };
  ok(
    "com repouso automático, ração vence a casinha",
    automationCtrl.nextAutomationStep(restKeyOnly, null)?.kind === "feed",
  );
  const paused = baseState({ level: 10, form: "werewolf" });
  const idle = { kind: "hunt", id: "village-field", paused: true };
  ok("pausado sem chave espera", automationCtrl.nextAutomationStep(paused, idle) === null);
  const resumed = { ...paused, automation: { ...paused.automation, hunt: true } };
  const work = automationCtrl.nextAutomationStep(resumed, idle);
  ok("pausado com chave retoma", work?.kind === "work" && work.activity.paused === false);
  ok(
    "retomar volta ao mesmo trabalho",
    work?.activity.kind === "hunt" && work?.activity.id === "village-field",
  );
  const bothKeys = { ...low, automation: { ...low.automation, potion: true, rest: true } };
  ok(
    "com frasco na mochila a poção vence o descanso",
    automationCtrl.nextAutomationStep(bothKeys, null)?.kind === "potion",
  );
  const floorTurn = {
    ...low,
    character: { ...low.character, rage: 100 },
    automation: { ...low.automation, transform: true },
  };
  ok(
    "no chão a fúria não vira sozinha, recupera antes",
    automationCtrl.nextAutomationStep(floorTurn, null)?.kind !== "transform",
  );
  ok(
    "descansando não deita de novo",
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
    "sem a chave o descanso não devolve nada",
    automationCtrl.resumeAfterRest(baseState({ level: 10 }), {
      kind: "rest",
      resume: { kind: "train", id: "ice-bath" },
    }) === null,
  );
  ok(
    "descanso sem lembrança não devolve nada",
    automationCtrl.resumeAfterRest(trainKeyed, { kind: "rest" }) === null,
  );
}
sec("taverna");
{
  const me = { id: "eu", name: "Teste", level: 60 };
  const other = { id: "ela", name: "Luna", level: 60 };
  const third = { id: "ele", name: "Lumni", level: 60 };
  let tavern = entTavern.emptyTavern();
  const bad = tavernCtrl.createRoom(tavern, me, "mesa da lua", "");
  ok("nome com espaço recusa", bad.ok === false);
  const lowbie = { id: "novato", name: "Novato", level: 10 };
  ok(
    "mesa sem senha exige o NV mínimo para abrir",
    tavernCtrl.createRoom(entTavern.emptyTavern(), lowbie, "Ninho", "").ok === false,
  );
  ok(
    "com senha o novato abre em qualquer nível",
    tavernCtrl.createRoom(entTavern.emptyTavern(), lowbie, "Ninho", "chave").ok === true,
  );
  const opened = tavernCtrl.createRoom(tavern, me, "Fogueira", "");
  ok("mesa abre", opened.ok === true);
  tavern = opened.state;
  ok("dona já está sentada", tavernCtrl.findRoom(tavern, opened.roomId).members.length === 1);
  ok(
    "mesa sem senha exige o NV mínimo para entrar",
    tavernCtrl.joinRoom(tavern, opened.roomId, lowbie, "").ok === false,
  );
  ok(
    "segunda mesa do mesmo dono recusa",
    tavernCtrl.createRoom(tavern, me, "Outra", "").ok === false,
  );
  ok("nome repetido recusa", tavernCtrl.createRoom(tavern, other, "fogueira", "").ok === false);
  const joined = tavernCtrl.joinRoom(tavern, opened.roomId, other, "");
  ok("entrar funciona", joined.ok === true);
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
    "a vigésima primeira cadeira não existe",
    tavernCtrl.joinRoom(tavern, opened.roomId, { id: "sobra", name: "Sobra", level: 60 }, "").ok ===
      false,
  );
  const backdate = () => {
    const seatRoom = tavernCtrl.findRoom(tavern, opened.roomId);
    const last = seatRoom.messages[seatRoom.messages.length - 1];
    if (last) last.at = new Date(Date.now() - 60000).toISOString();
  };
  for (let index = 0; index < 50; index += 1) {
    tavern = tavernCtrl.sendMessage(tavern, opened.roomId, me, "eco " + index).state;
    backdate();
  }
  ok(
    "mesa guarda 40 falas",
    tavernCtrl.findRoom(tavern, opened.roomId).messages.length === entTavern.MAX_ROOM_MESSAGES,
  );
  const rushedFirst = tavernCtrl.sendMessage(tavern, opened.roomId, me, "primeira do compasso");
  ok("fala fora do compasso passa", rushedFirst.ok === true);
  ok(
    "uma fala a cada dez segundos",
    tavernCtrl.sendMessage(rushedFirst.state, opened.roomId, me, "segunda imediata").ok === false,
  );
  const longTalk = tavernCtrl.sendMessage(tavern, opened.roomId, other, "a".repeat(200));
  ok(
    "fala é cortada em 150",
    longTalk.ok &&
      tavernCtrl
        .findRoom(longTalk.state, opened.roomId)
        .messages.at(-1).text.length === entTavern.MESSAGE_MAX_LENGTH,
  );
  const wentOut = tavernCtrl.leaveRoom(tavern, opened.roomId, { id: "x0", name: "Lobo0" });
  ok(
    "sair de vez escreve saiu da mesa",
    tavernCtrl.findRoom(wentOut.state, opened.roomId).messages.at(-1).text ===
      "Lobo0 saiu da mesa.",
  );
  const stepped = tavernCtrl.announceAway(tavern, opened.roomId, me);
  ok(
    "fechar a janela vai buscar uma bebida",
    stepped.ok &&
      tavernCtrl.findRoom(stepped.state, opened.roomId).messages.at(-1).text ===
        me.name + " foi buscar uma bebida.",
  );
  ok(
    "de fora não se anuncia saída",
    tavernCtrl.announceAway(tavern, opened.roomId, { id: "fora", name: "Fora" }).ok === false,
  );
  const cameBack = tavernCtrl.joinRoom(tavern, opened.roomId, me, "");
  ok(
    "retorno escreve na mesa",
    tavernCtrl.findRoom(cameBack.state, opened.roomId).messages.at(-1).text ===
      me.name + " retornou à mesa.",
  );
  ok("fala vazia recusa", tavernCtrl.sendMessage(tavern, opened.roomId, me, "   ").ok === false);
  ok(
    "link com https recusa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "olha https://exemplo.com/x").ok === false,
  );
  ok(
    "link com www recusa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "entra em www.exemplo.io").ok === false,
  );
  ok(
    "domínio pelado recusa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "acessa exemplo.com agora").ok === false,
  );
  ok(
    "fala com pontuação passa",
    tavernCtrl.sendMessage(tavern, opened.roomId, me, "Boa noite, matilha. Tudo bem?").ok === true,
  );
  ok(
    "de fora não se fala",
    tavernCtrl.sendMessage(tavern, opened.roomId, { id: "fora", name: "Fora" }, "oi").ok === false,
  );
  {
    let vault = entTavern.emptyTavern();
    const boss = { id: "dono", name: "Dono" };
    const nosy = { id: "xereta", name: "Xereta" };
    const locked = tavernCtrl.createRoom(vault, boss, "Trancada", "segredo");
    ok("mesa com senha abre", locked.ok === true);
    ok(
      "com senha o novato entra em qualquer nível",
      tavernCtrl.joinRoom(locked.state, locked.roomId, lowbie, "segredo").ok === true,
    );
    vault = tavernCtrl.sendMessage(locked.state, locked.roomId, boss, "conversa secreta").state;
    const stranger = tavernCtrl
      .listRooms(vault, nosy)
      .find((summary) => summary.room.id === locked.roomId);
    ok(
      "estranho vê a mesa trancada mas não a conversa",
      Boolean(stranger) && stranger.locked === true && stranger.room.messages.length === 0,
    );
    ok("o quadro nunca entrega o hash da senha", stranger.room.password === null);
    const owner = tavernCtrl
      .listRooms(vault, boss)
      .find((summary) => summary.room.id === locked.roomId);
    ok(
      "o dono lê a própria conversa sem o hash",
      owner.room.messages.length === 2 && owner.room.password === null,
    );
    const forged = tavernCtrl.leaveRoom(vault, locked.roomId, nosy);
    ok("estranho não força saída para varrer a mesa", forged.ok === false);
    ok(
      "a conversa da mesa trancada segue intacta",
      tavernCtrl.findRoom(forged.state, locked.roomId).messages.length === 2,
    );
  }
  const direct = tavernCtrl.openDirect(tavern, me, other);
  ok("mesa reservada abre", direct.ok === true);
  tavern = direct.state;
  ok(
    "terceiro não vê a mesa reservada",
    tavernCtrl.listRooms(tavern, third).every((summary) => summary.room.id !== direct.roomId),
  );
  ok(
    "os dois veem a mesa",
    tavernCtrl.listRooms(tavern, other).some((summary) => summary.room.id === direct.roomId),
  );
  ok(
    "terceiro não senta na reservada",
    tavernCtrl.joinRoom(tavern, direct.roomId, third, "").ok === false,
  );
  const reopened = tavernCtrl.openDirect(tavern, me, other);
  ok("reabrir acha a mesma mesa", reopened.ok && reopened.roomId === direct.roomId);
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
sec("matilha");
{
  const state = baseState({ level: 1 });
  const board = [
    { id: "mate-3", name: "Loba" },
    { id: "mate-5", name: "Aluado" },
    { id: "mate-6", name: "Aluada" },
  ];
  const added = packCtrl.addMate(state, { id: "mate-3", name: board[0].name });
  ok("guardar um nome funciona", added.ok === true);
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
  ok("a matilha para em 20", full.pack.length === 20);
  const byNick = packCtrl.matchNick(normalizeText("Loba"), board);
  ok("nick exato acha", typeof byNick === "object" && byNick.id === "mate-3");
  const vague = packCtrl.matchNick("alua", board);
  ok("pedaço ambíguo recusa", typeof vague === "string");
  const nobody = packCtrl.matchNick("Fantasma", board);
  ok("nick sem dono recusa", typeof nobody === "string");
  const removed = packCtrl.removeMate(added.state, "mate-3");
  ok("excluir devolve a vaga", removed.ok && removed.state.pack.length === 0);
}
sec("imutabilidade");
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
      ok("não muta: " + name, true);
    } catch (error) {
      ok("não muta: " + name, false, error.message);
    }
  }
}
sec("moeda e formato");
{
  ok("moeda fala WCoin", formatBronze(120) === "120 WCoins");
  ok("moeda no singular", formatBronze(1) === "1 WCoin");
  ok("parse simples", parseReais("50") === 5000);
  ok("parse com vírgula", parseReais("49,90") === 4990);
  ok("parse com milhar", parseReais("1.500,00") === 150000);
  ok("parse lixo é nulo", parseReais("abc") === null);
  ok("parse negativo é nulo", parseReais("-5") === null);
}
sec("persistência");
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
  ok("prata antiga vira bronze", loaded.character.bronze === 500);
  ok("a chave prata morre", !("silver" in loaded.character));
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
  ok("casaco antigo migra na mochila", loaded.inventory[0].itemId === "bronze-armor-female");
  ok("casaco antigo migra no corpo", loaded.equipment.armor?.itemId === "bronze-armor-female");
  ok(
    "casaco antigo migra a forja pra cópia e pro corpo",
    loaded.inventory[0].enhancement === 3 && loaded.equipment.armor?.enhancement === 3,
  );
  ok("casaco antigo migra no bazar", loaded.bazaarListings[0]?.itemId === "bronze-armor-female");
  put(
    shell({
      character: oldCharacter({}),
      pet: { id: "p", name: "Lobo", gender: "male", health: 55, adoptedAt: "2025-01-01" },
    }),
  );
  loaded = repo.load();
  ok("lobo da era da vida perde a vida", !("health" in loaded.pet));
  ok("lobo sem fôlego salvo chega vazio", loaded.pet.energy === 0);
  ok("lobo antigo lê nível 1", petRules.petLevelOf(loaded.pet) === 1);
  put(
    shell({
      character: oldCharacter({ level: "abc", experience: null, health: NaN }),
      mining: { level: 3 },
      wallet: { cents: NaN },
      pet: { id: "p", name: "L", gender: "male", energy: -50, level: NaN, adoptedAt: "x" },
    }),
  );
  loaded = repo.load();
  ok("nível podre vira 1", loaded.character.level === 1);
  ok("experiência podre vira 0", loaded.character.experience === 0);
  ok("vida podre vira o vital base", loaded.character.health === CONST.BASE_VITAL);
  ok("mineração sem progresso ganha 0", loaded.mining.progress === 0);
  ok("mineração antiga chega com a cota cheia", loaded.mining.count === 0);
  ok("carteira NaN volta aos R$ 10", loaded.wallet.cents === 1000);
  ok("fôlego negativo vira 0", loaded.pet.energy === 0);
  put(shell({ character: oldCharacter({}), wallet: undefined }));
  ok("save sem carteira ganha R$ 10", repo.load().wallet.cents === 1000);
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
  ok("id morto sai do corpo", loaded.equipment.claw === null);
  ok("a era da forja por id acabou", !("enhancements" in loaded));
  put("{{{isso não é json");
  loaded = repo.load();
  ok("json rasgado volta ao início", loaded.character === null);
  ok("json rasgado é resgatado", store.get(RESCUE) === "{{{isso não é json");
  put(shell({ version: 99, character: oldCharacter({}) }));
  loaded = repo.load();
  ok("versão do futuro volta ao início", loaded.character === null);
  ok("versão do futuro é resgatada", typeof store.get(RESCUE) === "string");
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
    "selo de arena podre é descartado",
    !("rival-2" in loaded.arenaDuels) && "rival-1" in loaded.arenaDuels,
  );
  ok(
    "chave de automação sobrevive",
    loaded.automation.hunt === true && loaded.automation.petFeed === false,
  );
  ok(
    "compra podre é descartada",
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
    "um save são atravessa inteiro",
    canon({ ...back, log: [] }) === canon({ ...roundtrip, log: [] }),
  );
  delete globalThis.window;
}
console.log("");
console.log("verificações: " + checks + "   falhas: " + failures);
for (const problem of problems) console.log("  ✘ " + problem);
process.exit(failures > 0 ? 1 : 0);
