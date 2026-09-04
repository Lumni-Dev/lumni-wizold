import { readdir, stat } from "node:fs/promises";
import { join, parse } from "node:path";

const RADIO_DIR = join(process.cwd(), "public", "assets", "radio");
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

export interface RadioTrack {
  name: string;
  url: string;
}

function prettyName(base: string): string {
  const cleaned = base.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : base;
}

export async function listRadioTracks(): Promise<RadioTrack[]> {
  let entries: string[];
  try {
    entries = await readdir(RADIO_DIR);
  } catch {
    return [];
  }
  const tracks: RadioTrack[] = [];
  for (const file of entries) {
    const parsed = parse(file);
    if (!AUDIO_EXTENSIONS.has(parsed.ext.toLowerCase())) continue;
    let version = "1";
    try {
      const info = await stat(join(RADIO_DIR, file));
      version = String(Math.round(info.mtimeMs));
    } catch {}
    tracks.push({
      name: prettyName(parsed.name),
      url: "/assets/radio/" + encodeURIComponent(file) + "?v=" + version,
    });
  }
  tracks.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return tracks;
}
