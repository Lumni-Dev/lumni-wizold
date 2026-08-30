import type { Gender } from "@/models/entities/character";
import { soundRepository } from "@/models/repositories/sound.repository";
const SOURCES = {
  ui: "/assets/sounds/ui/ui.mp3",
  denied: "/assets/sounds/ui/denied.mp3",
  levelup: "/assets/sounds/body/levelup.ogg",
  point: "/assets/sounds/body/point.mp3",
  transform: "/assets/sounds/body/transform.mp3",
  revert: "/assets/sounds/body/revert.mp3",
  rest: "/assets/sounds/body/rest.mp3",
  hit: "/assets/sounds/combat/hit.mp3",
  crit: "/assets/sounds/combat/crit.mp3",
  hurt: "/assets/sounds/combat/hurt.mp3",
  snap: "/assets/sounds/combat/snap.mp3",
  spoils: "/assets/sounds/combat/spoils.mp3",
  victory: "/assets/sounds/combat/victory.mp3",
  defeat: "/assets/sounds/combat/defeat.mp3",
  forge: "/assets/sounds/craft/forge.mp3",
  mine: "/assets/sounds/craft/mine.wav",
  vein: "/assets/sounds/craft/vein.mp3",
  potion: "/assets/sounds/craft/potion.mp3",
  equip: "/assets/sounds/craft/equip.mp3",
  discard: "/assets/sounds/craft/discard.mp3",
  buy: "/assets/sounds/craft/buy.ogg",
  sell: "/assets/sounds/craft/sell.ogg",
  "trunk-punches": "/assets/sounds/training/trunk-punches.mp3",
  "shadow-run": "/assets/sounds/training/shadow-run.mp3",
  "ice-bath": "/assets/sounds/training/ice-bath.mp3",
  "blind-tracking": "/assets/sounds/training/blind-tracking.mp3",
  "lunar-meditation": "/assets/sounds/training/lunar-meditation.mp3",
  growl: "/assets/sounds/wolf/growl.mp3",
  "pet-eat": "/assets/sounds/wolf/pet-eat.ogg",
  "pet-along": "/assets/sounds/wolf/pet-along.mp3",
  "pet-rest": "/assets/sounds/wolf/pet-rest.mp3",
  "pet-up": "/assets/sounds/wolf/pet-up.mp3",
  howl: "/assets/sounds/wolf/howl.mp3",
  beast: "/assets/sounds/wolf/beast.mp3",
  door: "/assets/sounds/tavern/door.mp3",
  chat: "/assets/sounds/tavern/chat.mp3",
} as const;
export type GameSound = keyof typeof SOURCES;
const VERSION = "?v=19";
const VOICED: readonly GameSound[] = ["hit", "crit", "hurt"];
const LINEAGE_VOICED: readonly GameSound[] = ["rest"];
let voice = { lineage: "male" as Gender };
export function setVoiceProfile(lineage: Gender): void {
  if (voice.lineage === lineage) return;
  voice = { lineage };
}
function sourceOf(sound: GameSound): string {
  const base = SOURCES[sound];
  const voiced = VOICED.includes(sound);
  if (!voiced && !LINEAGE_VOICED.includes(sound)) return base;
  const lineage = voice.lineage === "male" ? "lumni" : "luna";
  const suffix = voiced ? "-" + lineage + "-beast" : "-" + lineage;
  return base.replace(/\.(mp3|ogg|wav)$/, suffix + ".$1");
}
const cache = new Map<string, HTMLAudioElement>();
function elementOf(sound: GameSound): HTMLAudioElement {
  const source = sourceOf(sound);
  const cached = cache.get(source);
  if (cached) return cached;
  const audio = new Audio(source + VERSION);
  cache.set(source, audio);
  return audio;
}
export function isGameSound(name: string): name is GameSound {
  return name in SOURCES;
}
export function preloadSounds(): void {
  if (typeof window === "undefined") return;
  for (const sound of Object.keys(SOURCES) as GameSound[]) {
    elementOf(sound).preload = "auto";
  }
}
let spokeAt = 0;
export function playSound(sound: GameSound, delayMs = 0): void {
  if (typeof window === "undefined" || !soundRepository.enabled()) return;
  const fire = () => {
    if (!soundRepository.enabled()) return;
    spokeAt = Date.now();
    const audio = elementOf(sound);
    if (!audio.paused && !audio.ended) {
      const layer = audio.cloneNode(true) as HTMLAudioElement;
      void layer.play().catch(() => {});
      return;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  };
  if (delayMs > 0) window.setTimeout(fire, delayMs);
  else fire();
}
export function playClick(): void {
  if (typeof window === "undefined") return;
  const at = Date.now();
  window.setTimeout(() => {
    if (spokeAt < at) playSound("ui");
  }, 0);
}
