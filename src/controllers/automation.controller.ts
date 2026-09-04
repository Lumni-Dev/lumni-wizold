import { MIN_HEALTH_RATIO_TO_ACT } from "@/shared/constants/game";
import { ITEMS } from "@/models/data/items";
import type { Activity } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import type { PotionKind } from "@/models/entities/item";
import { isPetActive, isPetWhole, petShortOfBreath, servesPet } from "@/models/rules/pet";
import { deriveStats } from "@/models/rules/stats";
import { isFullMoon, potionFuryRemainingMs } from "@/models/rules/moon";
import { countInInventory } from "./inventory.controller";
import { listForge, listMining } from "./forge.controller";
import { listExercises } from "./training.controller";

export type AutomationStep =
  | { kind: "potion"; itemId: string }
  | { kind: "rest" }
  | { kind: "feed"; itemId: string }
  | { kind: "kennel"; active: boolean }
  | { kind: "work"; activity: Activity };

function smallestPotion(state: GameState, kind: PotionKind): string | null {
  const flasks = ITEMS.filter(
    (item) => item.potion === kind && countInInventory(state.inventory, item.id) > 0,
  ).sort((a, b) => a.price - b.price);

  return flasks[0]?.id ?? null;
}

function smallestRation(state: GameState): string | null {
  const rations = ITEMS.filter(
    (item) => servesPet(item) && countInInventory(state.inventory, item.id) > 0,
  ).sort((a, b) => a.price - b.price);

  return rations[0]?.id ?? null;
}

function furyHuntContext(activity: Activity | null): boolean {
  if (activity?.kind === "hunt") return true;
  if (activity?.kind === "rest" && activity.resume?.kind === "hunt") return true;
  return false;
}

export function rageFlaskToDrink(state: GameState): string | null {
  if (!state.automation.transform || !state.character) return null;
  if (isFullMoon()) return null;
  if (potionFuryRemainingMs(state.character) > 0) return null;
  return smallestPotion(state, "rage");
}

function canWork(state: GameState, activity: Activity): boolean {
  const character = state.character;
  if (!character) return false;

  switch (activity.kind) {
    case "hunt": {
      return character.health >= 1;
    }
    case "train": {
      const entry = listExercises(state).find(({ exercise }) => exercise.id === activity.id);
      return Boolean(entry && entry.affordable && !entry.maxed);
    }
    case "mine": {
      const mining = listMining(state);
      if (mining.dailyExhausted) return false;
      const entry = mining.ores.find(({ ore }) => ore.id === activity.id);
      return Boolean(entry?.unlocked);
    }
    case "forge": {
      const entry = listForge(state).find((piece) => piece.item.id === activity.id);
      return Boolean(entry?.canForge);
    }
    default:
      return false;
  }
}

export function nextAutomationStep(
  state: GameState,
  activity: Activity | null,
): AutomationStep | null {
  const character = state.character;
  if (!character) return null;

  const on = state.automation;
  const stats = deriveStats(character, state.equipment, state.pet);
  const floor = stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT;
  const resting = activity?.kind === "rest";
  const training = activity?.kind === "train";

  if (!training && character.health <= floor && character.health < stats.maxHealth) {
    if (on.potion) {
      const flask = smallestPotion(state, "health");
      if (flask) return { kind: "potion", itemId: flask };
    }
    if (on.rest && !resting) return { kind: "rest" };
  }

  const pet = state.pet;
  if (pet) {
    const spent = petShortOfBreath(pet);
    const ration = smallestRation(state);

    if (spent && on.petFeed && ration) return { kind: "feed", itemId: ration };
    if (spent && on.petRest && !ration && isPetActive(pet)) return { kind: "kennel", active: false };
    if (on.petRest && !isPetActive(pet) && isPetWhole(pet)) {
      return { kind: "kennel", active: true };
    }
  }

  if (!resting && furyHuntContext(activity)) {
    const rage = rageFlaskToDrink(state);
    if (rage) return { kind: "potion", itemId: rage };
  }

  if (activity?.paused && on[activity.kind as keyof typeof on] && canWork(state, activity)) {
    return { kind: "work", activity: { ...activity, paused: false } };
  }

  return null;
}

export function resumeAfterRest(state: GameState, activity: Activity | null): Activity | null {
  const resume = activity?.resume;
  if (!resume) return null;
  return state.automation[resume.kind as keyof typeof state.automation] ? { ...resume } : null;
}
