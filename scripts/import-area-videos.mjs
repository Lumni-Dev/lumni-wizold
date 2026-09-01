import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const AREAS = join(ROOT, "src", "models", "data", "areas");
const OUT = join(ROOT, "public", "assets", "hunt");

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv"]);

const source = process.argv[2];
if (!source) {
  console.error("uso: node scripts/import-area-videos.mjs <pasta com os videos>");
  process.exit(1);
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const areas = [];
for (const entry of readdirSync(AREAS)) {
  if (!entry.endsWith(".ts") || entry === "index.ts" || entry === "types.ts") continue;
  const text = readFileSync(join(AREAS, entry), "utf8");
  const id = text.match(/id:\s*"([^"]+)"/)?.[1];
  const name = text.match(/name:\s*"([^"]+)"/)?.[1];
  if (id && name) areas.push({ id, name: normalize(name) });
}

for (const entry of readdirSync(source)) {
  const { name, ext } = parse(entry);
  if (!VIDEO_EXTENSIONS.has(ext.toLowerCase())) continue;

  const key = normalize(name);
  const area = areas.find(
    (candidate) => candidate.id === key || candidate.name === key || candidate.name.startsWith(key + "-"),
  );
  if (!area) {
    console.error("sem área para " + entry);
    process.exitCode = 1;
    continue;
  }

  const target = join(OUT, area.id + ".mp4");
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      join(source, entry),
      "-filter_complex",
      "[0:v]scale=960:-2:flags=lanczos,setsar=1,split[a][b];" +
        "[b]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];" +
        "[a][r]concat=n=2:v=1[v]",
      "-map",
      "[v]",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "30",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      target,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );

  const size = (statSync(target).size / 1024 / 1024).toFixed(2);
  console.log(area.id.padEnd(20) + size + "MB");
}
