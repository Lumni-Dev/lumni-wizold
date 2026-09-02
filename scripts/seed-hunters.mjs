import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import pg from "pg";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BUILD = join(ROOT, ".sim");

function loadEnv() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
  }
}
loadEnv();

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
const equipment = require(join(BUILD, "models/data/equipment/index.js"));
const sets = require(join(BUILD, "models/data/equipment-sets.js"));
const economy = require(join(BUILD, "models/rules/economy.js"));
const stats = require(join(BUILD, "models/rules/stats.js"));
const game = require(join(BUILD, "shared/constants/game.js"));
const progression = require(join(BUILD, "models/rules/progression.js"));
const tuning = require(join(BUILD, "shared/constants/tuning/index.js"));
const items = require(join(BUILD, "models/data/items.js"));
const creatures = require(join(BUILD, "models/data/creatures.js"));
const territories = require(join(BUILD, "models/data/territories.js"));
const forgeRules = require(join(BUILD, "models/rules/forge.js"));

function preyAt(level) {
  const area =
    territories.TERRITORIES.find((one) => level >= one.minLevel && level <= one.maxLevel) ??
    territories.TERRITORIES[territories.TERRITORIES.length - 1];
  const pool = area.creatures
    .map((id) => creatures.findCreature(id))
    .filter(Boolean)
    .sort((left, right) => left.level - right.level);
  const reached = pool.filter((one) => one.level <= level);
  return reached[reached.length - 1] ?? pool[0];
}

function perHunt(level) {
  const prey = preyAt(level);
  if (!prey) return economy.huntPurse(level);
  const coin = (prey.minBronze + prey.maxBronze) / 2;
  const loot = (prey.drops ?? []).reduce((total, drop) => {
    const item = items.findItem(drop.itemId);
    if (!item) return total;
    const amount = ((drop.minimum ?? 1) + (drop.maximum ?? 1)) / 2;
    return total + drop.chance * amount * Math.max(1, Math.round(item.price * 0.5));
  }, 0);
  return coin + loot;
}

function earnedBy(level) {
  let total = 0;
  for (let step = 1; step < level; step += 1) {
    total += (tuning.levelRequirement(step) / tuning.levelYield(step)) * perHunt(step);
  }
  return total;
}

function huntsToReach(level) {
  let total = 0;
  for (let step = 1; step < level; step += 1) {
    total += progression.experienceForLevel(step) / (12 + step * 7);
  }
  return Math.round(total);
}

const NAMES = [
  "Luna",
  "LoboMau",
  "Krattos",
  "ZehLoko",
  "Nyxx",
  "Dravenn",
  "Shadoow",
  "Ravenna",
  "Thiagoo",
  "Bielzin",
  "NoxBR",
  "Sombraa",
  "Vitinho",
  "Fenrirr",
  "Duduzin",
  "Rafuxo",
  "Zangado",
  "Yasmiin",
  "Caiozin",
  "Lipao",
  "Uivo",
  "Gabsz",
  "Deividy",
  "Joaozin",
  "Kauazin",
  "Brunaa",
  "Vandall",
  "Pedrin",
  "Layzz",
  "Matheuzin",
  "Lobinha",
  "Renannn",
  "SrNada",
  "Jhow",
  "Vitoriaa",
  "Danilin",
  "Xamaa",
  "Erickzin",
  "Nathy",
  "Tiozao",
  "Cauannn",
  "Isaqui",
  "Fefezin",
  "Wesleyzin",
  "Prataa",
  "Mihzinha",
  "Lekao",
  "Dudaah",
  "Rickzin",
  "Bruxo7",
];

const LEVELS = [
  243, 228, 214, 205, 198, 187, 176, 168, 159, 151, 143, 136, 128, 121, 114, 108, 101, 95, 89, 84,
  79, 74, 69, 65, 61, 57, 53, 49, 46, 42, 39, 36, 33, 30, 28, 25, 23, 21, 19, 17,
  15, 13, 12, 10, 9, 8, 7, 5, 4, 3,
];

const SLOTS = equipment.EQUIPMENT_SLOTS ?? [
  "helmet",
  "necklace",
  "armor",
  "pants",
  "boots",
  "claw",
  "ring",
];

function pick(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function build(name, level, index) {
  const random = pick(level * 7919 + index * 104729 + 17);
  const gender = random() < 0.5 ? "male" : "female";
  const set = equipment.setForLevel(level);

  const trained = Math.max(
    game.BASE_ATTRIBUTE_VALUE,
    Math.min(game.MAX_ATTRIBUTE_VALUE, Math.round(level * 0.55 * (0.88 + random() * 0.24))),
  );
  const spread = () =>
    Math.max(
      game.BASE_ATTRIBUTE_VALUE,
      Math.min(game.MAX_ATTRIBUTE_VALUE, Math.round(trained * (0.82 + random() * 0.36))),
    );

  const attributes = {
    strength: spread(),
    agility: spread(),
    endurance: spread(),
    instinct: spread(),
    willpower: spread(),
  };

  const climbed = huntsToReach(level);
  const hunts = Math.max(1, Math.round(climbed * (0.94 + random() * 0.22)));
  const losses = Math.round(hunts * (0.03 + random() * 0.05));

  let purse = earnedBy(level) + (game.STARTING_BRONZE ?? 200);
  purse *= 0.62 + random() * 0.3;

  const worn = {};
  for (const slot of SLOTS) worn[slot] = null;
  const price = sets.piecePrice(set);
  const order = ["claw", "armor", "helmet", "pants", "boots", "necklace", "ring"];
  for (const slot of order) {
    if (!SLOTS.includes(slot)) continue;
    if (purse < price) continue;
    purse -= price;
    worn[slot] = { itemId: sets.pieceId(set.key, slot), enhancement: 0 };
  }

  const dressed = SLOTS.filter((slot) => worn[slot] !== null);
  if (dressed.length > 0) {
    let anvil = purse * (0.15 + random() * 0.45);
    let shards = hunts * (0.4 + random() * 0.5);
    let slot = 0;
    while (slot < dressed.length * 200) {
      const piece = worn[dressed[slot % dressed.length]];
      if (piece.enhancement >= game.MAX_ENHANCEMENT) break;
      const strike = forgeRules.forgeBronzeCost(level, piece.enhancement) / 0.75;
      const shard = tuning.forgeRequirement(piece.enhancement + 1) / 0.75;
      if (strike > anvil || shard > shards) break;
      anvil -= strike;
      purse -= strike;
      shards -= shard;
      piece.enhancement += 1;
      slot += 1;
    }
  }

  purse -= purse * (0.1 + random() * 0.35);
  const bronze = Math.max(game.STARTING_BRONZE ?? 200, Math.round(purse));

  const derived = stats.deriveStatsOf({ level, attributes, gender, form: "human" }, worn, null);

  return {
    name,
    gender,
    level,
    attributes,
    worn,
    hunts,
    wins: hunts - losses,
    losses,
    arenaWins: Math.round(level * (0.05 + random() * 0.06)),
    arenaLosses: Math.round(level * (0.02 + random() * 0.05)),
    bronze,
    mining: Math.max(1, Math.min(level, Math.round(level * (0.3 + random() * 0.3)))),
    health: Math.max(1, Math.round(derived.maxHealth * (0.72 + random() * 0.28))),
  };
}

const hunters = NAMES.map((name, index) => build(name, LEVELS[index], index));

const luna = hunters.find((hunter) => hunter.name === "Luna");
if (!luna) throw new Error("Luna precisa estar na lista");
for (const key of ["strength", "agility", "endurance", "instinct", "willpower"]) {
  const best = Math.max(...hunters.map((hunter) => hunter.attributes[key]));
  luna.attributes[key] = Math.min(game.MAX_ATTRIBUTE_VALUE, best + 7);
}
luna.bronze = Math.max(...hunters.map((hunter) => hunter.bronze)) + 24000;
luna.hunts = Math.max(...hunters.map((hunter) => hunter.hunts)) + 3100;
luna.wins = luna.hunts - luna.losses;
luna.mining = Math.max(...hunters.map((hunter) => hunter.mining)) + 4;
luna.arenaWins = Math.max(...hunters.map((hunter) => hunter.arenaWins)) + 5;

const ssl = process.env.PGSSLMODE
  ? { ca: readFileSync(join(ROOT, "certs/supabase-ca.crt"), "utf8"), rejectUnauthorized: true }
  : undefined;

const client = new pg.Client({ ssl });
await client.connect();

try {
  await client.query("begin");

  const gone = await client.query(
    "delete from users where id in (select user_id from characters where is_npc) returning id",
  );

  for (const hunter of hunters) {
    const userId = randomUUID();
    const characterId = randomUUID();
    await client.query(
      "insert into users (id, email, birth_date) values ($1, $2, $3)",
      [userId, "npc-" + hunter.name.toLowerCase() + "@wizold.test", "1990-01-01"],
    );
    await client.query(
      "insert into characters (id, user_id, name, gender, level, experience, health, rage," +
        " bronze, strength, agility, endurance, instinct, willpower, mining_level, hunts, wins," +
        " losses, arena_wins, arena_losses, is_npc)" +
        " values ($1,$2,$3,$4,$5,0,$6,0,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,true)",
      [
        characterId,
        userId,
        hunter.name,
        hunter.gender,
        hunter.level,
        hunter.health,
        hunter.bronze,
        hunter.attributes.strength,
        hunter.attributes.agility,
        hunter.attributes.endurance,
        hunter.attributes.instinct,
        hunter.attributes.willpower,
        hunter.mining,
        hunter.hunts,
        hunter.wins,
        hunter.losses,
        hunter.arenaWins,
        hunter.arenaLosses,
      ],
    );
    for (const slot of SLOTS) {
      const piece = hunter.worn[slot];
      if (!piece) continue;
      await client.query(
        "insert into equipped_items (character_id, slot, item_id, enhancement) values ($1,$2,$3,$4)",
        [characterId, slot, piece.itemId, piece.enhancement],
      );
    }
  }

  await client.query("commit");
  console.log("removidos: " + gone.rowCount + " npcs antigos");
  console.log("criados:   " + hunters.length + " npcs");
  for (const hunter of hunters.slice(0, 3)) {
    console.log(
      "  " +
        hunter.name.padEnd(16) +
        "NV " +
        String(hunter.level).padStart(4) +
        "  " +
        equipment.setForLevel(hunter.level).label.padEnd(8) +
        "  " +
        String(hunter.bronze).padStart(12) +
        " WCoins",
    );
  }
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
