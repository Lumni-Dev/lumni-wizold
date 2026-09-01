import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INVENTORY = join(ROOT, "public", "assets", "inventory");
const MATERIALS = join(ROOT, "src", "models", "data", "items", "materials");
const TMP = join(INVENTORY, ".tmp");
const OPENAI_API = "https://api.openai.com/v1/images/generations";
const MODEL = "gpt-image-1-mini";

function loadEnv() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function readMaterials() {
  const entries = [];
  for (const file of readdirSync(MATERIALS)) {
    if (!file.endsWith(".ts") || file === "index.ts") continue;
    const source = readFileSync(join(MATERIALS, file), "utf8");
    const id = source.match(/id: "([^"]+)"/)?.[1];
    const name = source.match(/name: "([^"]+)"/)?.[1];
    const description = source.match(/description:\s*\n?\s*"([^"]+)"/)?.[1];
    if (id && name) entries.push({ id, name, description: description ?? name });
  }
  return entries;
}

function existingIds() {
  const ids = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(png|webp|jpg|jpeg)$/i.test(entry.name)) ids.add(entry.name.replace(/\.[^.]+$/, ""));
    }
  };
  walk(INVENTORY);
  return ids;
}

function promptOf(item) {
  return (
    "Fantasy game inventory icon for \"" +
    item.name +
    "\": " +
    item.description +
    ". Monochrome hand-painted illustration in charcoal, silver and white only, no color. " +
    "Single loot object centered on a very dark charcoal background. " +
    "Painterly RPG item art, soft lighting, no text, no border, no watermark, square composition, " +
    "object fills about seventy percent of the frame. Werewolf hunting game, gritty medieval fantasy."
  );
}

async function generateImage(apiKey, item) {
  const response = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, prompt: promptOf(item), n: 1, size: "1024x1024" }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? "OpenAI image request failed");
  const b64 = payload.data?.[0]?.b64_json;
  const url = payload.data?.[0]?.url;
  if (b64) return Buffer.from(b64, "base64");
  if (!url) throw new Error("OpenAI returned no image data");
  const image = await fetch(url);
  if (!image.ok) throw new Error("Failed to download generated image");
  return Buffer.from(await image.arrayBuffer());
}

function toWebp(pngPath, webpPath) {
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      pngPath,
      "-vf",
      "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x121212",
      "-c:v",
      "libwebp",
      "-quality",
      "88",
      webpPath,
    ],
    { stdio: "ignore" },
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseLimit() {
  const flag = process.argv.find((arg) => arg.startsWith("--limit="));
  if (!flag) return null;
  const value = Number.parseInt(flag.slice(8), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

async function main() {
  loadEnv();
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error("OPENAI_API_KEY missing in .env.local");
    process.exit(1);
  }
  const allFlag = process.argv.includes("--all");
  const idsArg = process.argv.find((arg) => arg.startsWith("--ids="));
  const chosenIds = idsArg ? idsArg.slice(6).split(",") : allFlag ? null : ["basilisk-scale"];
  const limit = parseLimit();
  mkdirSync(INVENTORY, { recursive: true });
  mkdirSync(TMP, { recursive: true });
  const have = existingIds();
  let queue = readMaterials().filter((item) => !have.has(item.id));
  if (chosenIds) queue = queue.filter((item) => chosenIds.includes(item.id));
  if (limit) queue = queue.slice(0, limit);
  if (queue.length === 0) {
    console.log("Nothing to generate.");
    return;
  }
  console.log("Generating " + queue.length + " icon(s)...");
  let ok = 0;
  let fail = 0;
  for (const item of queue) {
    const pngPath = join(TMP, item.id + ".png");
    const webpPath = join(INVENTORY, item.id + ".webp");
    process.stdout.write(item.id + "... ");
    try {
      writeFileSync(pngPath, await generateImage(apiKey, item));
      toWebp(pngPath, webpPath);
      ok += 1;
      console.log("ok");
      await sleep(1500);
    } catch (error) {
      fail += 1;
      console.log("fail");
      console.error("  " + (error instanceof Error ? error.message : String(error)));
    }
  }
  console.log(
    "Done: " +
      ok +
      " ok, " +
      fail +
      " fail, " +
      (readMaterials().length - existingIds().size) +
      " still missing.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
