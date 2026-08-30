import { MIN_HEALTH_RATIO_TO_ACT } from "@/shared/constants/game";
import { ITEMS } from "@/models/data/items";
import type { Activity } from "@/models/entities/activity";
import type { GameState } from "@/models/entities/game-state";
import type { PotionKind } from "@/models/entities/item";
import { isPetActive, isPetWhole, petShortOfBreath, servesPet } from "@/models/rules/pet";
import { deriveStats } from "@/models/rules/stats";
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

function canWork(state: GameState, activity: Activity): boolean {
  const character = state.character;
  if (!character) return false;

  switch (activity.kind) {
    case "hunt": {
      const stats = deriveStats(character, state.equipment, state.pet, state.enhancements);
      return character.health > stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT;
    }
    case "train": {
      const entry = listExercises(state).find(({ exercise }) => exercise.id === activity.id);
      return Boolean(entry && entry.affordable && !entry.maxed);
    }
    case "mine": {
      const entry = listMining(state).ores.find(({ ore }) => ore.id === activity.id);
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
  const stats = deriveStats(character, state.equipment, state.pet, state.enhancements);
  const floor = stats.maxHealth * MIN_HEALTH_RATIO_TO_ACT;
  const resting = activity?.kind === "rest";

  // The floor recovery is always on, no switch needed: the moment vitals bottom
  // out the body drinks a health potion if the bag has one, otherwise lies down
  // to rest, every time, so it never sits helpless at the floor.
  if (character.health <= floor && character.health < stats.maxHealth) {
    const flask = smallestPotion(state, "health");
    if (flask) return { kind: "potion", itemId: flask };
    if (!resting) return { kind: "rest" };
  }

  const pet = state.pet;
  if (pet) {
    const spent = petShortOfBreath(pet);
    const ration = smallestRation(state);

    // The wolf's floor mirrors the body's, but stays opt-in: out of breath it
    // eats a ration if the bag has one, otherwise goes to the kennel. Feeding
    // rides either pet switch; the kennel is the petRest fallback when there is
    // no food.
    if (spent && (on.petFeed || on.petRest) && ration) return { kind: "feed", itemId: ration };
    if (spent && on.petRest && !ration && isPetActive(pet)) return { kind: "kennel", active: false };
    if (on.petRest && !isPetActive(pet) && isPetWhole(pet)) {
      return { kind: "kennel", active: true };
    }
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
