import { copyFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = process.argv[2] ?? join(process.env.USERPROFILE ?? "", "Downloads", "criaturas");
const TARGET_ROOT = join(ROOT, "public", "assets", "creatures");
const CREATURES = join(ROOT, "src", "models", "data", "creatures");

const ALIASES = {
  "coelho-do-camp": "coelho-do-campo",
  "verme-da-areia": "verme-das-areias",
  "corvo-de-chifre-torto": "cervo-de-chifre-torto",
  "guardiao-da-cripa": "guardiao-da-cripta",
  "urso-paro-jovem": "urso-pardo-jovem",
  "bode-eselvagem": "bode-selvagem",
  mercenaio: "mercenario",
  "fnix-menor": "fenix-menor",
  sucubu: "sucubo",
};

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function readCatalog() {
  const byName = new Map();

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.name.endsWith(".ts") || entry.name === "index.ts" || entry.name === "types.ts") {
        continue;
      }
      const source = readFileSync(path, "utf8");
      const id = source.match(/id: "([^"]+)"/)?.[1];
      const name = source.match(/name: "([^"]+)"/)?.[1];
      if (!id || !name) continue;
      const folder = basename(dirname(path));
      byName.set(normalize(name), { id, folder });
    }
  }

  walk(CREATURES);
  return byName;
}

if (!existsSync(SOURCE)) {
  console.error("Source folder not found: " + SOURCE);
  process.exit(1);
}

const catalog = readCatalog();
let copied = 0;
let skipped = 0;

for (const file of readdirSync(SOURCE)) {
  if (!/\.(png|webp|jpe?g)$/i.test(file)) continue;
  let key = normalize(basename(file).replace(/\.[^.]+$/, ""));
  key = ALIASES[key] ?? key;
  const entry = catalog.get(key);
  if (!entry) {
    console.warn("No match: " + file);
    skipped += 1;
    continue;
  }
  const folder = join(TARGET_ROOT, entry.folder);
  mkdirSync(folder, { recursive: true });
  const dest = join(folder, entry.id + ".png");
  copyFileSync(join(SOURCE, file), dest);
  console.log(file + " -> " + entry.folder + "/" + entry.id + ".png");
  copied += 1;
}

console.log("Done: " + copied + " copied, " + skipped + " skipped.");
