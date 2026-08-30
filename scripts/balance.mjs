import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BUILD = join(ROOT, ".sim");

execFileSync("npx", ["tsc", "-p", join(HERE, "tsconfig.sim.json")], {
  cwd: ROOT,
  stdio: ["ignore", "ignore", "inherit"],
  shell: true,
});

const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) request = join(BUILD, request.slice(2));
  return resolve.call(this, request, ...rest);
};

const require = createRequire(import.meta.url);
const { simulateCombat } = require(join(BUILD, "models/rules/combat.js"));
const { deriveStatsOf } = require(join(BUILD, "models/rules/stats.js"));
const { EQUIPMENT_SETS, pieceId, piecePrice, setForLevel } = require(
  join(BUILD, "models/data/equipment-sets.js"),
);
const { findItem } = require(join(BUILD, "models/data/items.js"));
const { trainingSessionCost, trainingSessionsPerPoint } = require(
  join(BUILD, "models/rules/training.js"),
);
const { findCreature } = require(join(BUILD, "models/data/creatures.js"));
const { TERRITORIES } = require(join(BUILD, "models/data/territories.js"));
const { EQUIPMENT_SLOTS } = require(join(BUILD, "models/entities/item.js"));
const { BASE_ATTRIBUTE_VALUE, MAX_ATTRIBUTE_VALUE, MIN_HEALTH_RATIO_TO_ACT } = require(
  join(BUILD, "shared/constants/game.js"),
);

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const TRAINED_PER_LEVEL = 0.55;

function trainedAt(level) {
  const value = Math.min(
    MAX_ATTRIBUTE_VALUE,
    Math.max(BASE_ATTRIBUTE_VALUE, Math.round(level * TRAINED_PER_LEVEL)),
  );
  return {
    strength: value,
    agility: value,
    endurance: value,
    instinct: value,
    willpower: value,
  };
}

const SET_BOUGHT_AT = 0.08;

function gearAt(level) {
  const owned = EQUIPMENT_SETS.filter((set) => set.minLevel <= level);
  const current = owned[owned.length - 1];
  const previous = owned[owned.length - 2] ?? null;
  const next = EQUIPMENT_SETS[owned.length];

  const start = current ? current.minLevel : 1;
  const end = (next ? next.minLevel : 1001) - 1;
  const at = Math.min(1, Math.max(0, (level - start) / Math.max(1, end - start)));

  const worn = at < SET_BOUGHT_AT ? (previous ?? current) : current;
  const equipment = {};
  for (const slot of EQUIPMENT_SLOTS) equipment[slot] = worn ? pieceId(worn.key, slot) : null;
  return { equipment, set: worn };
}

function preyAt(level) {
  // The territory whose band holds this level, then its strongest unlocked
  // creature (level <= hunterLevel), exactly like the hunt's pickCreature.
  const area =
    TERRITORIES.find((t) => level >= t.minLevel && level <= t.maxLevel) ??
    TERRITORIES[TERRITORIES.length - 1];
  const creatures = area.creatures
    .map((id) => findCreature(id))
    .filter(Boolean)
    .sort((a, b) => a.level - b.level);
  const eligible = creatures.filter((c) => c.level <= level);
  const creature = eligible[eligible.length - 1] ?? creatures[0];
  return { ...creature, name: creature.species };
}

function measure(level, fights = 400) {
  const attributes = trainedAt(level);
  const { equipment, set } = gearAt(level);
  const stats = deriveStatsOf({ level, attributes, form: "werewolf", enhancements: {} }, equipment);
  const prey = preyAt(level);
  const random = seeded(level * 7919 + 13);

  let lost = 0;
  let defeats = 0;
  let retreats = 0;
  let rounds = 0;

  for (let i = 0; i < fights; i += 1) {
    const outcome = simulateCombat({
      characterName: "Bot",
      currentHealth: stats.maxHealth,
      stats,
      creature: { ...prey, health: prey.health },
      pet: null,
      random,
    });

    lost += outcome.damageTaken;
    rounds += outcome.rounds.length;
    if (outcome.retreated) retreats += 1;
    else if (!outcome.victory) defeats += 1;
  }

  return {
    level,
    set: set ? set.label : "nenhum",
    prey: prey.name,
    strength: stats.totalAttributes.strength,
    endurance: stats.totalAttributes.endurance,
    maxHealth: stats.maxHealth,
    trained: attributes.strength,
    lossRatio: lost / fights / stats.maxHealth,
    defeatRatio: defeats / fights,
    retreatRatio: retreats / fights,
    rounds: rounds / fights,
  };
}

function session(level, nights = 300) {
  const attributes = trainedAt(level);
  const { equipment } = gearAt(level);
  const stats = deriveStatsOf({ level, attributes, form: "werewolf", enhancements: {} }, equipment);
  const prey = preyAt(level);
  const random = seeded(level * 104729 + 7);

  let hunts = 0;
  let defeats = 0;

  for (let night = 0; night < nights; night += 1) {
    let health = stats.maxHealth;

    while (health >= stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT) {
      const outcome = simulateCombat({
        characterName: "Bot",
        currentHealth: health,
        stats,
        creature: { ...prey, health: prey.health },
        pet: null,
        random,
      });

      hunts += 1;
      if (!outcome.victory && !outcome.retreated) {
        defeats += 1;
        break;
      }
      health = outcome.finalHealth;
    }
  }

  return { hunts: hunts / nights, defeatRatio: defeats / hunts };
}

function economy(level) {
  const prey = preyAt(level);
  const bronze = (prey.minBronze + prey.maxBronze) / 2;

  const loot = (prey.drops ?? []).reduce((total, drop) => {
    const item = findItem(drop.itemId);
    if (!item) return total;
    const amount = ((drop.minimum ?? 1) + (drop.maximum ?? 1)) / 2;
    return total + drop.chance * amount * Math.max(1, Math.round(item.price * 0.5));
  }, 0);

  const set = setForLevel(level);
  const setPrice = EQUIPMENT_SLOTS.reduce((total, slot) => total + piecePrice(set, slot), 0);

  const point =
    trainingSessionsPerPoint(level, Math.round(level * 0.55)) * trainingSessionCost(level, Math.round(level * 0.55));
  const perHunt = bronze + loot;

  return {
    perHunt,
    bronze,
    loot,
    setPrice,
    point,
    huntsForSet: setPrice / perHunt,
    huntsPerPoint: point / perHunt,
  };
}

function line(row) {
  const percent = (value) => (value * 100).toFixed(1).padStart(5) + "%";
  return [
    "NV " + String(row.level).padStart(4),
    row.set.padEnd(9),
    row.prey.padEnd(8),
    "treino " + String(row.trained).padStart(4),
    "FOR " + String(row.strength).padStart(6),
    "RES " + String(row.endurance).padStart(6),
    "vida " + String(row.maxHealth).padStart(7),
    "perda " + percent(row.lossRatio),
    "derrota " + percent(row.defeatRatio),
    "recuo " + percent(row.retreatRatio),
    "rodadas " + row.rounds.toFixed(1).padStart(5),
  ].join("  ");
}

const single = Number(process.argv[2]);
if (Number.isFinite(single) && single > 0) {
  console.log(line(measure(single, 2000)));
  const night = session(single);
  console.log(
    "  caçadas por noite " +
      night.hunts.toFixed(1) +
      "   derrotas na sequência " +
      (night.defeatRatio * 100).toFixed(1) +
      "%",
  );
} else {
  const levels = [];
  for (const area of TERRITORIES) {
    levels.push(area.minLevel, Math.round((area.minLevel + area.maxLevel) / 2), area.maxLevel);
  }
  for (const level of levels) {
    const row = measure(Math.max(1, level));
    const night = session(Math.max(1, level), 120);
    console.log(
      line(row) +
        "  noite " +
        night.hunts.toFixed(1).padStart(4) +
        "  morte " +
        (night.defeatRatio * 100).toFixed(1).padStart(4) +
        "%",
    );
  }

  console.log("");
  console.log("ECONOMIA: o que uma caçada paga e o que ela compra");
  for (const level of levels) {
    const at = Math.max(1, level);
    const money = economy(at);
    console.log(
      [
        "NV " + String(at).padStart(4),
        "caçada " + Math.round(money.perHunt).toString().padStart(7),
        "(bronze " + Math.round(money.bronze).toString().padStart(6),
        "loot " + Math.round(money.loot).toString().padStart(6) + ")",
        "conjunto " + Math.round(money.setPrice).toString().padStart(9),
        "= " + money.huntsForSet.toFixed(0).padStart(5) + " caçadas",
        "ponto " + Math.round(money.point).toString().padStart(7),
        "= " + money.huntsPerPoint.toFixed(1).padStart(5) + " caçadas por ponto",
      ].join("  "),
    );
  }
}
