import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT = join(ROOT, "public", "assets", "voice");

const VOICE_ID = "pFZP5JQG7iQjIQuC4Bku";
const MODEL_ID = "eleven_multilingual_v2";
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.8,
  style: 0.45,
  use_speaker_boost: true,
};

const FILTERS = [
  "silenceremove=start_periods=1:start_threshold=-45dB",
  "apad=pad_dur=0.9",
  "aecho=0.9:0.85:110|240:0.28|0.14",
  "loudnorm=I=-16:TP=-1.5:LRA=11",
].join(",");

for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2];
}

const key = process.env.ELEVEN_APY_KEY ?? "";
if (!key) {
  console.error("ELEVEN_APY_KEY missing in .env.local");
  process.exit(1);
}

const lore = readFileSync(join(ROOT, "src", "models", "data", "lore.ts"), "utf8");
const chapters = [];
const block = /text:\s*((?:"(?:[^"\\]|\\.)*"\s*\+?\s*)+),\s*voice:\s*"\/assets\/voice\/([a-z]+)\.mp3/g;
for (const match of lore.matchAll(block)) {
  const text = Array.from(match[1].matchAll(/"((?:[^"\\]|\\.)*)"/g))
    .map((piece) => piece[1])
    .join("");
  chapters.push({ name: match[2], text });
}

if (chapters.length === 0) {
  console.error("no chapters found in lore.ts");
  process.exit(1);
}

const only = process.argv[2];
const wanted = only ? chapters.filter((chapter) => chapter.name === only) : chapters;
if (wanted.length === 0) {
  console.error("no chapter named " + only);
  process.exit(1);
}

const TMP = mkdtempSync(join(tmpdir(), "wizold-narrate-"));

for (const chapter of wanted) {
  const answer = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/" + VOICE_ID + "?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        text: chapter.text,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
    },
  );

  if (!answer.ok) {
    console.error(chapter.name + " failed: " + answer.status + " " + (await answer.text()));
    process.exitCode = 1;
    continue;
  }

  const raw = join(TMP, chapter.name + ".mp3");
  writeFileSync(raw, Buffer.from(await answer.arrayBuffer()));

  const target = join(OUT, chapter.name + ".mp3");
  execFileSync(
    "ffmpeg",
    ["-y", "-loglevel", "error", "-i", raw, "-af", FILTERS, "-ac", "1", "-b:a", "96k", target],
    { stdio: ["ignore", "ignore", "inherit"] },
  );

  const seconds = execFileSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    target,
  ])
    .toString()
    .trim();
  console.log(chapter.name.padEnd(10) + Number(seconds).toFixed(1) + "s");
}

rmSync(TMP, { recursive: true, force: true });
