import { ATTRIBUTES } from "@/models/entities/attribute";
import { CATEGORY_LABEL, type Item } from "@/models/entities/item";
import { enhancedEffect, exactEnhancedValue } from "@/models/rules/forge";
import { furyWillpowerExtraMs } from "@/models/rules/moon";
import { FURY_ATTRIBUTE_BONUS } from "@/shared/constants/game";
import { FURY } from "@/shared/constants/tuning/fury";
import { formatFraction, formatFuryClock, formatFuryDuration, formatMinutesLabel } from "@/shared/utils/format";

export function itemInitials(name: string): string {
  const words = name.split(" ").filter((word) => word.length > 2);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function itemSubtitle(item: Item): string {
  return CATEGORY_LABEL[item.category];
}

function percent(ratio: number): string {
  return "+" + Math.round(ratio * 100) + "%";
}

export function summarizeEffect(item: Item, enhancement = 0, willpower?: number): string[] {
  const effect = enhancement > 0 ? enhancedEffect(item, enhancement) : item.effect;
  const lines: string[] = [];

  if (effect.health) lines.push("+" + effect.health + " health");
  if (effect.healthMin !== undefined || effect.healthMax !== undefined) {
    const min = effect.healthMin ?? effect.healthMax ?? 0;
    const max = effect.healthMax ?? effect.healthMin ?? 0;
    lines.push("+" + min + " to " + max + " health");
  }
  if (effect.petEnergyRatio) lines.push(percent(effect.petEnergyRatio) + " of the companion's energy");
  if (effect.healthRatio) lines.push(percent(effect.healthRatio) + " of the health");
  if (effect.furyMinutes) {
    lines.push("+" + FURY_ATTRIBUTE_BONUS + " to all attributes");
    lines.push(formatMinutesLabel(effect.furyMinutes) + " long");
    if (willpower !== undefined) {
      const stretch = furyWillpowerExtraMs(willpower);
      if (stretch >= 1000) lines.push("+" + formatFuryClock(stretch) + " of willpower");
    }
  }

  for (const definition of ATTRIBUTES) {
    const base = item.effect.attributes?.[definition.key];
    if (!base) continue;
    const value = enhancement > 0 ? exactEnhancedValue(base, enhancement) : base;
    lines.push("+" + formatFraction(value) + " " + definition.name);
  }

  return lines;
}

export function furyDurationCopy(baseMinutes: number, willpower: number): string {
  return formatFuryDuration(baseMinutes, furyWillpowerExtraMs(willpower));
}

// What one flask of the given size lasts for this sheet: base clock plus the
// Willpower stretch in seconds, the same shape the bag and the drink toast
// already use. The combat panel's fury rows on the character and ranking
// profile pages read this. The willpower handed in must not carry the fury
// buff itself, mirroring consumeItem, or a sheet read mid-fury would promise
// a longer clock than the next flask actually delivers.
export function furyPotionClock(
  size: keyof typeof FURY.durationMinutesBySize,
  willpower: number,
): string {
  return formatFuryDuration(
    FURY.durationMinutesBySize[size],
    furyWillpowerExtraMs(willpower),
  );
}
