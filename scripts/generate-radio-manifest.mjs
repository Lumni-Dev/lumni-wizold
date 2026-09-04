import { readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DIR = join(ROOT, "public", "assets", "radio");
const OUT = join(ROOT, "public", "radio-manifest.json");

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".ogg",
  ".oga",
  ".opus",
  ".m4a",
  ".aac",
  ".wav",
  ".flac",
  ".webm",
]);

function prettyName(base) {
  const cleaned = base.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : base;
}

let entries = [];
try {
  entries = readdirSync(DIR);
} catch {}

const tracks = [];
for (const file of entries) {
  const parsed = parse(file);
  if (!AUDIO_EXTENSIONS.has(parsed.ext.toLowerCase())) continue;
  let version = "1";
  try {
    version = String(Math.round(statSync(join(DIR, file)).mtimeMs));
  } catch {}
  tracks.push({
    name: prettyName(parsed.name),
    url: "/assets/radio/" + encodeURIComponent(file) + "?v=" + version,
  });
}

tracks.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
writeFileSync(OUT, JSON.stringify(tracks));
console.log("Wrote public/radio-manifest.json (" + tracks.length + " tracks)");
