import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, parse, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ASSETS = join(ROOT, "public", "assets");

const FOLDERS = [
  "inventory",
  "hunt",
  "attributes",
  "training",
  "creatures",
  "pet",
  "genders",
  "store",
];

const SOURCE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const MAX_SIZE = {
  inventory: 512,
  store: 512,
  creatures: 768,
  hunt: 1080,
  attributes: 512,
  training: 512,
  genders: 1024,
  pet: 1024,
};

const DEFAULT_SIZE = 512;
const DEFAULT_QUALITY = 80;
const QUALITY = {
  attributes: 95,
  training: 95,
  genders: 95,
  pet: 95,
  creatures: 95,
};

const force = process.argv.includes("--force");
const asked = process.argv.slice(2).filter((argument) => !argument.startsWith("-"));
const folders = asked.length ? asked : FOLDERS;

function collect(dir) {
  const found = [];
  let entries;

  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      found.push(...collect(path));
      continue;
    }

    if (SOURCE_EXTENSIONS.has(parse(entry.name).ext.toLowerCase())) found.push(path);
  }

  return found;
}

function megabytes(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + "MB";
}

let before = 0;
let after = 0;
let written = 0;

for (const folder of folders) {
  const width = MAX_SIZE[folder] ?? DEFAULT_SIZE;
  const quality = QUALITY[folder] ?? DEFAULT_QUALITY;

  for (const source of collect(join(ASSETS, folder))) {
    const target = source.replace(/\.(png|jpe?g)$/i, ".webp");
    if (existsSync(target) && !force) continue;

    const args = [
      "-y",
      "-loglevel",
      "error",
      "-i",
      source,
      "-vf",
      "scale=w=" + width + ":h=" + width + ":force_original_aspect_ratio=decrease:flags=lanczos",
      "-c:v",
      "libwebp",
      "-pix_fmt",
      "yuva420p",
      "-preset",
      "picture",
      "-compression_level",
      "6",
      "-q:v",
      String(quality),
      "-frames:v",
      "1",
    ];

    execFileSync("ffmpeg", [...args, target], { stdio: ["ignore", "ignore", "inherit"] });

    const from = statSync(source).size;
    const to = statSync(target).size;
    before += from;
    after += to;
    written += 1;

    console.log(
      relative(ASSETS, target).replaceAll(sep, "/").padEnd(48) +
        megabytes(from) +
        " -> " +
        megabytes(to),
    );
  }
}

if (!written) {
  console.log("nada a converter");
} else {
  console.log("");
  console.log(written + " arquivos: " + megabytes(before) + " -> " + megabytes(after));
}
