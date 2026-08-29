import { ATTRIBUTES } from "@/models/entities/attribute";
import { CATEGORY_LABEL, RARITY_LABEL, SET_LABEL, type Item } from "@/models/entities/item";
import { enhancedEffect } from "@/models/rules/forge";

export function itemInitials(name: string): string {
  const words = name.split(" ").filter((word) => word.length > 2);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function itemSubtitle(item: Item): string {
  const category = CATEGORY_LABEL[item.category];
  return item.set
    ? category + " - " + SET_LABEL[item.set]
    : category + " - " + RARITY_LABEL[item.rarity];
}

function percent(ratio: number): string {
  return "+" + Math.round(ratio * 100) + "%";
}

export function summarizeEffect(item: Item, enhancement = 0): string[] {
  const effect = enhancement > 0 ? enhancedEffect(item, enhancement) : item.effect;
  const lines: string[] = [];

  if (effect.health) lines.push("+" + effect.health + " vida");
  if (effect.rage) lines.push("+" + effect.rage + " fúria");
  if (effect.petEnergyRatio) lines.push(percent(effect.petEnergyRatio) + " da energia do mascote");
  if (effect.healthRatio) lines.push(percent(effect.healthRatio) + " da vida");
  if (effect.rageRatio) lines.push(percent(effect.rageRatio) + " da fúria");

  for (const definition of ATTRIBUTES) {
    const value = effect.attributes?.[definition.key];
    if (value) lines.push("+" + value + " " + definition.code);
  }

  return lines;
}
