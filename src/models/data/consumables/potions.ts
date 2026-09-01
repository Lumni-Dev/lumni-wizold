import { SIZE_LABEL, type Item, type PotionSize } from "@/models/entities/item";
import { FURY } from "@/shared/constants/tuning/fury";

const POTION_TIERS = [
  {
    size: "small" as PotionSize,
    ratio: 0.25,
    hunts: 3,
    rarity: "common" as const,
    minLevel: 1,
    price: 3,
  },
  {
    size: "medium" as PotionSize,
    ratio: 0.5,
    hunts: 6,
    rarity: "uncommon" as const,
    minLevel: 334,
    price: 100,
  },
  {
    size: "large" as PotionSize,
    ratio: 0.75,
    hunts: 12,
    rarity: "rare" as const,
    minLevel: 667,
    price: 480,
  },
];

type PotionTier = (typeof POTION_TIERS)[number];

const POTION_LINES = [
  {
    kind: "health" as const,
    label: "Vida",
    id: "health",
    description:
      "Espessa e morna, com cheiro de ferro velho. Fecha em segundos o corte que a sua " +
      "própria cura levaria a noite inteira para costurar.",
    effect: (tier: PotionTier) => ({ healthRatio: tier.ratio }),
  },
  {
    kind: "rage" as const,
    label: "Fúria",
    id: "rage",
    description:
      "Não devolve nada ao corpo: acende a fera por dentro. Enquanto dura, +10 em cada " +
      "atributo, e o quanto dura depende do tamanho do frasco.",
    effect: (tier: PotionTier) => ({ furyMinutes: FURY.durationMinutesBySize[tier.size] }),
  },
];

export const POTIONS: readonly Item[] = POTION_LINES.flatMap((line) =>
  POTION_TIERS.map((tier) => ({
    id: line.id + "-potion-" + tier.size,
    name: "Poção de " + line.label + " " + SIZE_LABEL[tier.size],
    description: line.description,
    category: "potion" as const,
    rarity: tier.rarity,
    price: tier.price,
    huntCost: tier.hunts,
    minLevel: tier.minLevel,
    stackable: true,
    inMarket: true,
    effect: line.effect(tier),
    potion: line.kind,
    size: tier.size,
  })),
);
