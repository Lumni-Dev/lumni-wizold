import type { HuntResolution } from "@/controllers/hunt.controller";

const held = new Map<string, { resolution: HuntResolution; at: number }>();
const TTL_MS = 120000;

export function holdHunt(characterId: string, resolution: HuntResolution): void {
  held.set(characterId, { resolution, at: Date.now() });
}

export function takeHunt(characterId: string): HuntResolution | null {
  const entry = held.get(characterId);
  held.delete(characterId);
  if (!entry || Date.now() - entry.at > TTL_MS) return null;
  return entry.resolution;
}
