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
const entMining = load("models/entities/mining.js");
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
function baseState({ level = 1, gender = "male", bronze = 1000000, form = "human" } = {}) {
  const state = factory.createRun("Teste", gender);
  const trained = clamp(Math.round(level * 0.55), CONST.BASE_ATTRIBUTE_VALUE, 1000);
  state.character = {
    ...state.character,
    level,
    form,
    bronze,
    attributes: {
      strength: trained,
      agility: trained,
      endurance: trained,
      instinct: trained,
      willpower: trained,
    },
  };
  const derived = stats.deriveStats(
    state.character,
    state.equipment,
    state.pet,
    state.enhancements,
  );
  state.character.health = derived.maxHealth;
  state.character.rage = derived.maxRage;
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
    enhancements: {},
    mining: 1,
    pet: null,
    equipment: entItem.emptyEquipment(),
    ...over,
  };
}
sec("stats");
{
  for (const level of [1, 7, 83, 165, 170, 340, 505, 670, 999, 1000]) {
    for (const form of ["human", "werewolf"]) {
      const trained = clamp(Math.round(level * 0.55), 4, 1000);
      const attrs = {
        strength: trained,
        agility: trained,
        endurance: trained,
        instinct: trained,
        willpower: trained,
      };
      const derived = stats.deriveStatsOf(
        { level, attributes: attrs, form },
        entItem.emptyEquipment(),
      );
      const t = derived.totalAttributes;
      ok(
        "saúde pela fórmula NV " + level,
        derived.maxHealth ===
          Math.round(
            CONST.BASE_VITAL +
              (t.endurance - CONST.BASE_ATTRIBUTE_VALUE) * CONST.HEALTH_PER_ENDURANCE,
          ),
      );
      ok(
        "fúria pela fórmula NV " + level,
        derived.maxRage ===
          Math.round(
            CONST.BASE_VITAL +
              (t.willpower - CONST.BASE_ATTRIBUTE_VALUE) * CONST.RAGE_PER_WILLPOWER,
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
        derived.sources.form[key];
      for (const key of ["strength", "agility", "endurance", "instinct", "willpower"]) {
        ok("fontes somam o total (" + key + ")", sourceSum(key) === t[key]);
      }
      if (form === "werewolf") {
        ok(
          "fera dá só Força NV " + level,
          derived.sources.form.strength > 0 &&
            derived.sources.form.agility === 0 &&
            derived.sources.form.endurance === 0 &&
            derived.sources.form.instinct === 0 &&
            derived.sources.form.willpower === 0,
        );
      }
    }
    const attrs = { strength: 50, agility: 50, endurance: 50, instinct: 50, willpower: 50 };
    const human = stats.deriveStatsOf(
      { level, attributes: attrs, form: "human" },
      entItem.emptyEquipment(),
    );
    const beast = stats.deriveStatsOf(
      { level, attributes: attrs, form: "werewolf" },
      entItem.emptyEquipment(),
    );
    ok("virada não muda vida máxima NV " + level, human.maxHealth === beast.maxHealth);
    ok("virada não muda fúria máxima NV " + level, human.maxRage === beast.maxRage);
    ok(
      "fera soma 35% de Força NV " + level,
      beast.totalAttributes.strength ===
        human.totalAttributes.strength +
          Math.round(human.totalAttributes.strength * CONST.WEREWOLF_STRENGTH_BONUS),
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
  state.equipment.claw = "bronze-claw";
  state.enhancements["bronze-claw"] = 10;
  const item = items.findItem("bronze-claw");
  const effect = forgeRules.enhancedEffect(item, 10);
  const withGear = stats.deriveStats(state.character, state.equipment, null, state.enhancements);
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
        currentRage: 100,
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
          outcome.rageGained,
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
      ok(
        "fúria por rodada",
        outcome.rageGained % 7 === 0 && outcome.rageGained <= CONST.MAX_COMBAT_ROUNDS * 7,
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
  ok("multiplicador sem fúria", combat.criticalMultiplierOf(0) === 1.7);
  ok("multiplicador com fúria cheia", combat.criticalMultiplierOf(100) === 2.2);
  ok("fúria acima do vital base não passa de 2,2", combat.criticalMultiplierOf(5000) === 2.2);
}
sec("bandas e presas");
{
  const bands = ["rabbit", "deer", "bear", "human", "vampire", "unicorn"].map((key) => ({
    key,
    ...species.bandOf(key),
  }));
  ok("primeira banda começa em 1", bands[0].start === 1);
  ok("última banda termina em 1000", bands[5].end === 1000);
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    ok("banda " + band.key + " cresce", band.end > band.start);
    if (index > 0)
      ok("banda " + band.key + " vem depois da anterior", band.start === bands[index - 1].end + 5);
    if (index > 0) ok("borda inicial múltipla de 5 (" + band.key + ")", band.start % 5 === 0);
    if (index < 5) ok("borda final múltipla de 5 (" + band.key + ")", band.end % 5 === 0);
  }
  const creatures = creaturesData.CREATURES;
  ok("30 criaturas", creatures.length === 30);
  ok("ids únicos", new Set(creatures.map((c) => c.id)).size === 30);
  for (const creature of creatures) {
    const band = species.bandOf(creature.species);
    ok(
      "variante dentro da banda " + creature.id,
      creature.level >= band.start && creature.level <= band.end,
    );
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
    ok("bolsa mínima <= máxima " + creature.id, creature.minBronze <= creature.maxBronze);
    ok(
      "experiência linear " + creature.id,
      creature.experience === Math.round(15 + creature.level * 11),
    );
    for (const drop of creature.drops) {
      ok("chance válida " + creature.id + "/" + drop.itemId, drop.chance > 0 && drop.chance <= 1);
      const male = items.itemIdFor(drop.itemId, "male");
      const female = items.itemIdFor(drop.itemId, "female");
      ok("drop resolve para macho " + drop.itemId, Boolean(items.findItem(male)));
      ok("drop resolve para fêmea " + drop.itemId, Boolean(items.findItem(female)));
    }
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
      "sessão custa a fatia do ponto mais o nível do atributo NV " + level,
      training.trainingSessionCost(level, trainedValue) ===
        Math.max(1, Math.round(training.trainingPointCost(level) / 5)) +
          Math.max(0, trainedValue - 1),
    );
    if (trainedValue > 1) {
      ok(
        "treinar fica mais caro a cada ponto do atributo NV " + level,
        training.trainingSessionCost(level, trainedValue) >
          training.trainingSessionCost(level, trainedValue - 1),
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
  const bronzeSetTotal = entItem.EQUIPMENT_SLOTS.reduce(
    (total, slot) => total + sets.piecePrice(sets.EQUIPMENT_SETS[0], slot),
    0,
  );
  ok("conjunto de bronze custa 570", bronzeSetTotal === 570);
  for (const level of [100, 340, 670, 1000]) {
    const value = Math.round(level * 0.55);
    const sessions = Math.ceil(
      progression.progressNeeded(value) / training.trainingEffort(level).progress,
    );
    ok("ponto sai em 3..7 sessões NV " + level, sessions >= 3 && sessions <= 7, sessions);
    const perPoint = (sessions * training.trainingSessionCost(level, value)) / species.huntPurse(level);
    ok(
      "ponto custa 1..10 caçadas NV " + level,
      perPoint >= 1 && perPoint <= 10,
      perPoint.toFixed(2),
    );
  }
  ok(
    "renomear custa 30 caçadas com piso",
    characterCtrl.renameCost({ level: 500 }) ===
      Math.max(500, Math.round(species.huntPurse(500) * 30)),
  );
}
sec("progressão");
{
  for (const level of [1, 25, 500, 1000]) {
    ok(
      "experiência exigida NV " + level,
      progression.experienceForLevel(level) === Math.round(100 * level * (1 + level / 25)),
    );
  }
  const character = baseState({ level: 5 }).character;
  const short = progression.applyExperience({ ...character, experience: 0 }, 10);
  ok("ganho curto acumula", short.character.experience === 10 && short.levelsGained === 0);
  const crossing = progression.applyExperience(
    { ...character, experience: progression.experienceForLevel(5) - 1 },
    1,
  );
  ok(
    "cruzar o limiar sobe um nível",
    crossing.levelsGained === 1 && crossing.character.level === 6,
  );
  ok("nível novo começa do zero", crossing.character.experience === 0);
  const atCap = progression.applyExperience({ ...character, level: 1000, experience: 0 }, 99999999);
  ok("teto de nível segura", atCap.character.level === 1000 && atCap.levelsGained === 0);
  ok(
    "no teto a barra fica cheia",
    atCap.character.experience === progression.experienceForLevel(1000),
  );
  const negative = progression.applyExperience({ ...character, experience: 50 }, -30);
  ok("ganho negativo não rouba", negative.character.experience === 50);
  const trainee = {
    ...character,
    attributes: { ...character.attributes, strength: 10 },
    trainingProgress: { ...character.trainingProgress, strength: 49 },
  };
  const raised = progression.applyTrainingProgress(trainee, "strength", 1);
  ok(
    "ponto sobe ao cruzar",
    raised.pointsGained === 1 && raised.character.attributes.strength === 11,
  );
  ok("progresso zera no ponto", raised.character.trainingProgress.strength === 0);
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
  const now = Date.now();
  const iso = (msAgo) => new Date(now - msAgo).toISOString();
  ok("sem selos, três ataques", arena.arenaCharges({}, now).left === 3);
  ok("um selo ativo gasta um", arena.arenaCharges({ a: iso(60000) }, now).left === 2);
  const spent = arena.arenaCharges({ a: iso(1000), b: iso(2000), c: iso(3000) }, now);
  ok("três selos zeram", spent.left === 0 && spent.returnsIn > 0);
  ok("selo vencido devolve", arena.arenaCharges({ a: iso(25 * 3600000) }, now).left === 3);
  ok("selo inválido não trava", arena.arenaCooldownLeft("data-podre", now) === 0);
  const random = seededRandom(99);
  for (const level of [1, 100, 500, 1000]) {
    const range = arena.arenaSpoilsRange(level);
    const purse = species.huntPurse(level);
    ok(
      "faixa de espólio 2..5 bolsas NV " + level,
      range.min === Math.round(purse * 2) && range.max === Math.round(purse * 5),
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
  const inBand = baseState({ level: 5, form: "werewolf" });
  const rival = benchHunter("pit-near", 5);
  const pit = [rival, benchHunter("pit-far", 500)];
  const human = { ...inBand, character: { ...inBand.character, form: "human" } };
  ok(
    "humano não desce ao fosso",
    arenaCtrl.resolveArena(human, pit, rival.id, random).ok === false,
  );
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
    "descanso de 24h é recusado",
    arenaCtrl.resolveArena(cooling, pit, rival.id, random).ok === false,
  );
  const drained = {
    ...inBand,
    arenaDuels: {
      x: new Date().toISOString(),
      y: new Date().toISOString(),
      z: new Date().toISOString(),
    },
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
    ok("derrota no fosso volta ao humano", humbled.state.character.form === "human");
    ok("derrota no fosso limpa o selo", humbled.state.character.transformedAt === undefined);
    const winner = arenaCtrl.landArena(
      inBand,
      { ...duel.data, combat: { ...duel.data.combat, victory: true, retreated: false } },
      0,
    );
    ok("vitória mantém a fera de pé", winner.state.character.form === "werewolf");
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
  const state = baseState({ level: 170, form: "werewolf" });
  state.equipment.claw = "silver-claw";
  const humanState = { ...state, character: { ...state.character, form: "human" } };
  ok("humano não caça", huntCtrl.resolveHunt(humanState, "dew-woods", random).ok === false);
  const weak = { ...state, character: { ...state.character, health: 1 } };
  ok("vida no chão não caça", huntCtrl.resolveHunt(weak, "dew-woods", random).ok === false);
  ok(
    "território trancado recusa",
    huntCtrl.resolveHunt(state, "white-clearing", random).ok === false,
  );
  ok("território desconhecido recusa", huntCtrl.resolveHunt(state, "nada", random).ok === false);
  const resolved = huntCtrl.resolveHunt(state, "dew-woods", random);
  ok("caçada válida resolve", resolved.ok === true);
  if (resolved.ok) {
    const beaten = {
      ...resolved.data,
      combat: { ...resolved.data.combat, victory: false, retreated: false },
      bronze: 0,
      drops: [],
    };
    const humbledHunt = huntCtrl.landHunt(state, beaten, 0);
    ok("derrota na caçada volta ao humano", humbledHunt.state.character.form === "human");
    ok("derrota na caçada limpa o selo", humbledHunt.state.character.transformedAt === undefined);

    const landed = huntCtrl.landHunt(state, resolved.data, 0);
    const before = state.character;
    const after = landed.state.character;
    const derived = stats.deriveStats(before, state.equipment, state.pet, state.enhancements);
    ok("bronze soma o saque", after.bronze === before.bronze + resolved.data.bronze);
    ok("caçadas contam", after.hunts === before.hunts + 1);
    ok(
      "vida desce o que a luta tirou",
      after.health ===
        clamp(Math.max(1, before.health - resolved.data.healthLost), 0, derived.maxHealth),
    );
    ok(
      "fúria sobe pelas rodadas",
      after.rage === clamp(before.rage + resolved.data.combat.rageGained, 0, derived.maxRage),
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
  ok("no vão a presa trava no teto da banda", gapView.prey.level === 165);
  ok("a presa é a variante mais forte destravada", gapView.prey.name === "Lebre da Lua Nova");
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
      "o lobo que caça aprende",
      landed.state.pet.trainingProgress > 0 || landed.state.pet.level > 1,
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
  const state = baseState({ level: 100, form: "werewolf" });
  const human = { ...state, character: { ...state.character, form: "human" } };
  ok("humano não treina", trainingCtrl.train(human, "trunk-punches").ok === false);
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
  ok(
    "humano não treina o lobo",
    petCtrl.trainPet({ ...withPet, character: { ...withPet.character, form: "human" } }).ok ===
      false,
  );
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
  state.inventory = [...state.inventory, { itemId: "pet-ration", quantity: 2 }];
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
  const adopt = petCtrl.adoptPet({ ...baseState({ level: 1 }), pet: null }, "female", "Neve");
  ok(
    "adoção cobra o preço",
    adopt.ok && adopt.state.character.bronze === 1000000 - CONST.PET_PRICE,
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
  for (let level = 1; level <= 1000; level += 1) {
    if (forgeRules.enhancementCost(level) !== Math.max(1, Math.ceil(level / 5))) {
      ok("custo de forja no nível " + level, false);
      break;
    }
  }
  const claw = items.findItem("lunar-claw");
  const forged = forgeRules.enhancedEffect(claw, 100);
  const base = claw.effect.attributes.strength;
  ok(
    "forja soma 1 ponto por nível mais 0,2%",
    forged.attributes.strength === base + 100 + Math.round(base * 0.002 * 100),
  );
  ok("forja zero devolve o efeito puro", forgeRules.enhancedEffect(claw, 0) === claw.effect);
  const state = baseState({ level: 1 });
  state.equipment.claw = "bronze-claw";
  state.enhancements["bronze-claw"] = 4;
  state.inventory = [...state.inventory, { itemId: "bronze-fragment", quantity: 10 }];
  const strikeFee = forgeRules.forgeBronzeCost(state.character.level, 4);
  const enhanced = forgeCtrl.enhance(state, "claw", () => 0);
  ok("martelada certeira sobe um nível", enhanced.ok && enhanced.state.enhancements["bronze-claw"] === 5);
  ok("martelada certeira responde raised", enhanced.ok && enhanced.data.raised === true);
  ok(
    "forja consome o fragmento do conjunto",
    enhanced.ok &&
      inventoryCtrl.countInInventory(enhanced.state.inventory, "bronze-fragment") ===
        10 - forgeRules.enhancementCost(5),
  );
  ok(
    "martelada cobra bronze",
    enhanced.ok && enhanced.state.character.bronze === state.character.bronze - strikeFee,
  );
  const missed = forgeCtrl.enhance(state, "claw", () => 0.99);
  ok(
    "martelada falha mantém o nível",
    missed.ok && missed.state.enhancements["bronze-claw"] === 4 && missed.data.raised === false,
  );
  ok(
    "martelada falha ainda consome fragmentos",
    missed.ok &&
      inventoryCtrl.countInInventory(missed.state.inventory, "bronze-fragment") ===
        10 - forgeRules.enhancementCost(5),
  );
  ok(
    "martelada falha também paga o ferreiro",
    missed.ok && missed.state.character.bronze === state.character.bronze - strikeFee,
  );
  const broke = { ...state, character: { ...state.character, bronze: strikeFee - 1 } };
  ok("sem bronze a bigorna recusa", forgeCtrl.enhance(broke, "claw", () => 0).ok === false);
  ok(
    "a martelada encarece com a peça e com a banda",
    forgeRules.forgeBronzeCost(1, 5) > forgeRules.forgeBronzeCost(1, 4) &&
      forgeRules.forgeBronzeCost(500, 4) > forgeRules.forgeBronzeCost(1, 4),
  );
  const wrongFragments = { ...state, inventory: [{ itemId: "silver-fragment", quantity: 99 }] };
  ok(
    "fragmento de outro conjunto não serve",
    forgeCtrl.enhance(wrongFragments, "claw").ok === false,
  );
  ok("espaço vazio recusa", forgeCtrl.enhance(state, "helmet").ok === false);
  if (enhanced.ok) {
    const off = inventoryCtrl.unequipItem(enhanced.state, "claw");
    ok("desequipar preserva a forja", off.ok && off.state.enhancements["bronze-claw"] === 5);
    const on = inventoryCtrl.equipItem(off.state, "bronze-claw");
    ok("reequipar lê a mesma forja", on.ok && on.state.enhancements["bronze-claw"] === 5);
  }
  const ores = entMining.ORES;
  for (let index = 1; index < ores.length; index += 1) {
    ok(
      "escada da mina sobe " + ores[index].id,
      ores[index].requiredLevel > ores[index - 1].requiredLevel,
    );
  }
  ok(
    "teto da mineração vem da última veia",
    entMining.MINING_MAX_LEVEL === ores[ores.length - 1].requiredLevel,
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
  ok("golpe avança a escada", swing.ok && swing.state.mining.progress === 10);
  const deep = { ...miner, mining: { level: 40, progress: 0 } };
  const bonusSwing = forgeCtrl.mine(deep, "bronze-vein", seededRandom(2));
  const bonus = miningRules.miningYieldBonus(40);
  ok(
    "rendimento multiplica a cada 20 níveis",
    bonusSwing.ok &&
      inventoryCtrl.countInInventory(bonusSwing.state.inventory, "bronze-fragment") % bonus === 0,
  );
}
sec("bazar");
{
  ok("taxa da casa é 10%", bazaarRules.feeOf(1000) === 100 && bazaarRules.sellerNet(1000) === 900);
  ok("saque mínimo é R$ 100", bazaarRules.MIN_WITHDRAW_CENTS === 10000);
  ok("carteira nova tem R$ 10", factory.createRun("Novo", "male").wallet.cents === 1000);
  const fragment = items.findItem("bronze-fragment");
  const plain = items.findItem("bronze-claw");
  const material = items.findItem("soft-fur");
  ok("fragmento entra no bazar", bazaarRules.checkTrade(fragment, 0).tradable === true);
  ok("peça forjada entra", bazaarRules.checkTrade(plain, 1).tradable === true);
  ok("peça lisa de mercado não entra", bazaarRules.checkTrade(plain, 0).tradable === false);
  ok("material de caça não entra", bazaarRules.checkTrade(material, 0).tradable === false);
  const state = baseState({ level: 1 });
  state.enhancements["bronze-claw"] = 2;
  state.inventory = [
    ...state.inventory,
    { itemId: "bronze-claw", quantity: 1 },
    { itemId: "bronze-fragment", quantity: 30 },
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
    bought.ok && bought.state.enhancements["gold-claw"] === offer.enhancement,
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
  const ids = ["health-potion-small", "bronze-fragment", "soft-fur", "bronze-claw"];
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
  ok("peça em dupla recusa", marketCtrl.buyItem(state, "bronze-claw", 2).ok === false);
  ok(
    "peça já na mochila recusa",
    bought.ok && marketCtrl.buyItem(bought.state, "bronze-claw", 1).ok === false,
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
  const fragmentSale = marketCtrl.sellItem(
    { ...state, inventory: [{ itemId: "bronze-fragment", quantity: 5 }] },
    "bronze-fragment",
    1,
  );
  ok("fragmento não se vende por bronze", fragmentSale.ok === false);
  const sale = marketCtrl.sellItem(
    { ...state, inventory: [{ itemId: "soft-fur", quantity: 5 }] },
    "soft-fur",
    2,
  );
  const fur = items.findItem("soft-fur");
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
      dressed.state.equipment.claw === "bronze-claw",
  );
  ok(
    "peça no corpo recusa comprar de novo",
    dressed.ok && marketCtrl.buyItem(dressed.state, "bronze-claw", 1).ok === false,
  );
  const spareState = dressed.ok
    ? { ...dressed.state, inventory: [...dressed.state.inventory, { itemId: "bronze-claw", quantity: 1 }] }
    : dressed.state;
  const swapped = inventoryCtrl.equipItem(spareState, "bronze-claw");
  ok(
    "trocar pela mesma peça conserva",
    swapped.ok && inventoryCtrl.countInInventory(swapped.state.inventory, "bronze-claw") === 1,
  );
  const potion = inventoryCtrl.consumeItem(
    { ...state, inventory: [{ itemId: "health-potion-small", quantity: 1 }] },
    "health-potion-small",
  );
  ok("poção sem ferida recusa", potion.ok === false);
  const hurt = {
    ...state,
    character: { ...state.character, health: 1 },
    inventory: [{ itemId: "health-potion-small", quantity: 1 }],
  };
  const healed = inventoryCtrl.consumeItem(hurt, "health-potion-small");
  const derived = stats.deriveStats(state.character, state.equipment, null, {});
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
  ok("perfil de outro caçador abre", profile !== null && profile.positions.length === 13);
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
  const derived = stats.deriveStats(run.character, run.equipment, null, {});
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
  state.character.rage = 100;
  const turned = characterCtrl.toggleForm(state);
  ok(
    "virar cobra 40 de fúria",
    turned.ok && turned.state.character.rage === 60 && turned.state.character.form === "werewolf",
  );
  ok("virada guarda o selo", turned.ok && typeof turned.state.character.transformedAt === "string");
  const back = characterCtrl.toggleForm(turned.state);
  ok("voltar limpa o selo", back.ok && back.state.character.transformedAt === undefined);
  const angry = { ...state, character: { ...state.character, rage: 39 } };
  ok("sem fúria não vira", characterCtrl.toggleForm(angry).ok === false);
  const dying = { ...state, character: { ...state.character, health: 1, rage: 100 } };
  ok("no chão não vira", characterCtrl.toggleForm(dying).ok === false);
  const bloated = { ...state, character: { ...state.character, health: 99999, rage: 99999 } };
  const squeezed = characterCtrl.syncCharacter(bloated);
  const ceiling = stats.deriveStats(state.character, state.equipment, null, {});
  ok(
    "teto encolhido aperta os vitais",
    squeezed.character.health === ceiling.maxHealth &&
      squeezed.character.rage === ceiling.maxRage,
  );
  ok("corpo em dia não troca referência", characterCtrl.syncCharacter(state) === state);
  const stale = {
    ...turned.state,
    character: {
      ...turned.state.character,
      transformedAt: new Date(Date.now() - 16 * 60000).toISOString(),
    },
  };
  const expired = characterCtrl.expireTransformation(stale);
  ok("fúria vencida volta sozinha", expired.state.character.form === "human");
  ok(
    "fúria no prazo continua",
    characterCtrl.expireTransformation(turned.state).state.character.form === "werewolf",
  );
  const tired = { ...state, character: { ...state.character, health: 50, rage: 10 } };
  const resting = characterCtrl.startRest(tired);
  ok("repousar volta ao humano", resting.ok && resting.state.character.form === "human");
  const tick = characterCtrl.restTick(resting.state);
  const max = stats.deriveStats(resting.state.character, state.equipment, null, {}).maxHealth;
  ok(
    "tique devolve 10%",
    tick.ok &&
      tick.state.character.health === Math.min(max, 50 + Math.max(1, Math.ceil(max * 0.1))),
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
  const floor = stats.deriveStats(low.character, low.equipment, null, {}).maxHealth;
  low.character.health = Math.max(1, Math.floor(floor * 0.1));
  ok("ferido sem chave não age", automationCtrl.nextAutomationStep(low, null) === null);
  const withPotion = { ...low, automation: { ...low.automation, potion: true } };
  const step = automationCtrl.nextAutomationStep(withPotion, null);
  ok("ferido com chave bebe", step?.kind === "potion" && step.itemId === "health-potion-small");
  const noFlask = {
    ...withPotion,
    inventory: [],
    automation: { ...low.automation, potion: true, rest: true },
  };
  ok("sem poção, deita", automationCtrl.nextAutomationStep(noFlask, null)?.kind === "rest");
  const angry = baseState({ level: 10 });
  angry.character.rage = 100;
  const turnable = { ...angry, automation: { ...angry.automation, transform: true } };
  ok(
    "fúria automática vira",
    automationCtrl.nextAutomationStep(turnable, null)?.kind === "transform",
  );
  const calm = {
    ...angry,
    character: { ...angry.character, rage: 0 },
    automation: { ...angry.automation, transform: true, potion: true },
    inventory: [{ itemId: "rage-potion-small", quantity: 1 }],
  };
  const drink = automationCtrl.nextAutomationStep(calm, null);
  ok(
    "sem fúria bebe a poção de fúria",
    drink?.kind === "potion" && drink.itemId === "rage-potion-small",
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
  petState.inventory = [{ itemId: "pet-ration", quantity: 1 }];
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
}
sec("taverna");
{
  const me = { id: "eu", name: "Teste" };
  const other = { id: "ela", name: "Luna" };
  const third = { id: "ele", name: "Lumni" };
  let tavern = entTavern.emptyTavern();
  const bad = tavernCtrl.createRoom(tavern, me, "mesa da lua", "");
  ok("nome com espaço recusa", bad.ok === false);
  const opened = tavernCtrl.createRoom(tavern, me, "Fogueira", "");
  ok("mesa abre", opened.ok === true);
  tavern = opened.state;
  ok("dona já está sentada", tavernCtrl.findRoom(tavern, opened.roomId).members.length === 1);
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
      { id: "x" + extra, name: "Lobo" + extra },
      "",
    ).state;
  }
  ok(
    "a vigésima primeira cadeira não existe",
    tavernCtrl.joinRoom(tavern, opened.roomId, { id: "sobra", name: "Sobra" }, "").ok === false,
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
  const byNick = packCtrl.addByNick(state, normalizeText("Loba"), board);
  ok("nick exato acha", byNick.ok === true);
  const vague = packCtrl.addByNick(state, "alua", board);
  ok("pedaço ambíguo recusa", vague.ok === false);
  const nobody = packCtrl.addByNick(state, "Fantasma", board);
  ok("nick sem dono recusa", nobody.ok === false);
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
  state.equipment.claw = "silver-claw";
  state.enhancements["silver-claw"] = 3;
  state.inventory = [
    { itemId: "health-potion-small", quantity: 5 },
    { itemId: "silver-fragment", quantity: 20 },
    { itemId: "bronze-claw", quantity: 1 },
    { itemId: "pet-ration", quantity: 2 },
    { itemId: "soft-fur", quantity: 3 },
  ];
  state.enhancements["bronze-claw"] = 1;
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
    ["sellItem", () => marketCtrl.sellItem(state, "soft-fur", 1)],
    ["listOffers", () => marketCtrl.listOffers(state)],
    ["equipItem", () => inventoryCtrl.equipItem(state, "bronze-claw")],
    ["unequipItem", () => inventoryCtrl.unequipItem(state, "claw")],
    ["consumeItem", () => inventoryCtrl.consumeItem(state, "health-potion-small")],
    ["discardItem", () => inventoryCtrl.discardItem(state, "soft-fur", 1)],
    ["enhance", () => forgeCtrl.enhance(state, "claw")],
    ["mine", () => forgeCtrl.mine(state, "bronze-vein", random)],
    ["listForge", () => forgeCtrl.listForge(state)],
    ["listMining", () => forgeCtrl.listMining(state)],
    ["announce+cancel", () => bazaarCtrl.announceListing(state, "silver-fragment", 3, 500)],
    ["listSellable", () => bazaarCtrl.listSellable(state)],
    ["listBoard", () => bazaarCtrl.listBoard(state, [offer])],
    ["purchaseListing", () => bazaarCtrl.purchaseListing(state, offer, 1)],
    ["requestWithdraw", () => bazaarCtrl.requestWithdraw(state, "chave-pix")],
    ["purchasePack", () => storeCtrl.purchasePack(state, "one-pouch")],
    ["toggleForm", () => characterCtrl.toggleForm(state)],
    ["startRest", () => characterCtrl.startRest(state)],
    ["restTick", () => characterCtrl.restTick(state)],
    ["sufferBlow", () => characterCtrl.sufferBlow(state, 12)],
    ["grantExperience", () => characterCtrl.grantExperience(state, 50)],
    ["expireTransformation", () => characterCtrl.expireTransformation(state)],
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
  ok("bronze fala bronze", formatBronze(120) === "120 de bronze");
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
  ok("casaco antigo migra no corpo", loaded.equipment.armor === "bronze-armor-female");
  ok("casaco antigo migra na forja", loaded.enhancements["bronze-armor-female"] === 3);
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
  ok("carteira NaN volta aos R$ 10", loaded.wallet.cents === 1000);
  ok("fôlego negativo vira 0", loaded.pet.energy === 0);
  put(shell({ character: oldCharacter({}), wallet: undefined }));
  ok("save sem carteira ganha R$ 10", repo.load().wallet.cents === 1000);
  put(
    shell({
      character: oldCharacter({}),
      inventory: [
        { itemId: "espada-fantasma", quantity: 2 },
        { itemId: "soft-fur", quantity: 1 },
      ],
      equipment: { claw: "garra-fantasma" },
      enhancements: { "espada-fantasma": 4 },
    }),
  );
  loaded = repo.load();
  ok(
    "id morto sai da mochila",
    loaded.inventory.length === 1 && loaded.inventory[0].itemId === "soft-fur",
  );
  ok("id morto sai do corpo", loaded.equipment.claw === null);
  ok("id morto sai da forja", !("espada-fantasma" in loaded.enhancements));
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
