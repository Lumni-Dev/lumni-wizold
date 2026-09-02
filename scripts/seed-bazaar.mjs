import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
const sets = require(join(BUILD, "models/data/equipment-sets.js"));
const ores = require(join(BUILD, "models/data/ores/index.js"));
const items = require(join(BUILD, "models/data/items.js"));
const bazaar = require(join(BUILD, "models/rules/bazaar.js"));
const itemEntity = require(join(BUILD, "models/entities/item.js"));
const SLOTS = itemEntity.EQUIPMENT_SLOTS;

const SET_ORDER = ["bronze", "silver", "gold", "diamond", "lunar"];
const LIFETIME_HOURS = 24 * 7;
const OLDEST_HOURS = 150;
const LOTS = [5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80];
const APPLY = process.argv.includes("--apply");

function pick(seed) {
  let value = seed % 4294967296;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function seedOf(text) {
  let value = 7;
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) % 4294967296;
  }
  return value;
}

function ownedSets(level) {
  const current = sets.setForLevel(level);
  const tier = SET_ORDER.indexOf(current.key);
  const owned = [current.key];
  if (tier > 0) owned.push(SET_ORDER[tier - 1]);
  return owned;
}

function veinsFor(miningLevel) {
  return ores.ORES.filter((ore) => ore.requiredLevel <= miningLevel);
}

function priceFor(item, enhancement, random) {
  const suggested = bazaar.suggestedPriceCents(item, enhancement);
  const moved = Math.round((suggested * (0.78 + random() * 0.64)) / 10) * 10;
  return Math.min(bazaar.MAX_LISTING_CENTS, Math.max(bazaar.MIN_LISTING_CENTS, moved));
}

function listingsFor(hunter, random) {
  const made = [];
  const owned = ownedSets(hunter.level);
  const veins = veinsFor(hunter.mining);

  const pieces = hunter.forged > 0 ? (random() < 0.28 ? 2 : 1) : 0;
  const taken = new Set();
  for (let count = 0; count < pieces; count += 1) {
    const set = owned[random() < 0.7 ? 0 : owned.length - 1];
    const slot = SLOTS[Math.floor(random() * SLOTS.length)];
    const enhancement = 1 + Math.floor(random() * hunter.forged);
    const item = items.findItem(sets.pieceId(set, slot));
    if (!item || taken.has(item.id)) continue;
    taken.add(item.id);
    made.push({ item, enhancement, quantity: 1 });
  }

  if (veins.length > 0 && random() < 0.44) {
    const vein = veins[Math.floor(random() * veins.length)];
    const item = items.findItem(vein.fragmentId);
    const stock = Math.round(hunter.hunts * (0.08 + random() * 0.24));
    const lots = LOTS.filter((lot) => lot <= stock);
    const quantity = lots.length > 0 ? lots[Math.floor(random() * lots.length)] : 0;
    if (item && quantity > 0) made.push({ item, enhancement: 0, quantity });
  }

  return made;
}

const ssl = process.env.PGSSLMODE
  ? { ca: readFileSync(join(ROOT, "certs/supabase-ca.crt"), "utf8"), rejectUnauthorized: true }
  : undefined;

const client = new pg.Client({ ssl });
await client.connect();

try {
  await client.query("begin");

  const gone = await client.query(
    "delete from bazaar_listings where seller_id in (select id from characters where is_npc)" +
      " returning id",
  );

  await client.query(
    "insert into wallets (character_id, cents) select id, 1000 from characters where is_npc" +
      " on conflict (character_id) do nothing",
  );

  const found = await client.query(
    "select c.id, c.name, c.level, c.bronze, c.mining_level, c.hunts," +
      " coalesce(max(e.enhancement), 0) as forged" +
      " from characters c left join equipped_items e on e.character_id = c.id" +
      " where c.is_npc group by c.id order by c.level desc",
  );

  let announced = 0;
  let spent = 0;
  const board = [];

  for (const row of found.rows) {
    const hunter = {
      id: String(row.id),
      name: String(row.name),
      level: Number(row.level),
      bronze: Number(row.bronze),
      mining: Number(row.mining_level),
      hunts: Number(row.hunts),
      forged: Number(row.forged),
    };
    const random = pick(seedOf(hunter.name) + hunter.level * 7919);
    const fee = bazaar.bazaarListingFee(hunter.level);
    let purse = hunter.bronze;

    for (const entry of listingsFor(hunter, random)) {
      if (purse < fee) break;
      purse -= fee;
      spent += fee;

      const hours = 1 + random() * OLDEST_HOURS;
      const when = new Date(Date.now() - hours * 3600000).toISOString();
      const cents = priceFor(entry.item, entry.enhancement, random);
      const id = "listing_" + hunter.id.slice(0, 8) + "_" + String(announced);

      await client.query(
        "insert into bazaar_listings (id, seller_id, item_id, enhancement, quantity," +
          " price_cents, status, announced_at) values ($1,$2,$3,$4,$5,$6,'active',$7)",
        [id, hunter.id, entry.item.id, entry.enhancement, entry.quantity, cents, when],
      );
      announced += 1;
      board.push({
        name: hunter.name,
        item: entry.item.name,
        enhancement: entry.enhancement,
        quantity: entry.quantity,
        cents,
        days: (LIFETIME_HOURS - hours) / 24,
      });
    }

    if (purse !== hunter.bronze) {
      await client.query("update characters set bronze = $2 where id = $1", [hunter.id, purse]);
    }
  }

  await client.query(APPLY ? "commit" : "rollback");

  console.log(APPLY ? "gravado no banco" : "ensaio: nada gravado, rode com --apply");
  console.log("removidos:  " + gone.rowCount + " anuncios antigos");
  console.log("anunciados: " + announced + " anuncios de " + found.rowCount + " caçadores");
  console.log("taxas:      " + spent.toLocaleString("pt-BR") + " WCoins pagos");
  console.log("");
  for (const line of board.slice(0, 8)) {
    console.log(
      "  " +
        line.name.padEnd(12) +
        (line.item + (line.enhancement > 0 ? " +" + line.enhancement : "")).padEnd(28) +
        ("x" + line.quantity).padStart(6) +
        ("R$ " + (line.cents / 100).toFixed(2)).padStart(12) +
        "   " +
        line.days.toFixed(1) +
        "d",
    );
  }
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
