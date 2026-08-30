import { SIZE_LABEL, type Item, type PotionSize } from "@/models/entities/item";

// Two lines (vida, fúria) in three sizes. `hunts` prices each size in carcasses of
// the buyer's level, proportional to how much it heals (a quarter, a half, a whole
// vital). `minLevel` splits the run in thirds: NV 1 / 334 / 667. `price` is a flat
// fallback.
const POTION_TIERS = [
  {
    size: "small" as PotionSize,
    ratio: 0.25,
    hunts: 3,
    rarity: "common" as const,
    minLevel: 1,
    price: 60,
  },
  {
    size: "medium" as PotionSize,
    ratio: 0.5,
    hunts: 6,
    rarity: "uncommon" as const,
    minLevel: 334,
    price: 2500,
  },
  {
    size: "large" as PotionSize,
    ratio: 1,
    hunts: 12,
    rarity: "rare" as const,
    minLevel: 667,
    price: 12000,
  },
];

const POTION_LINES = [
  {
    kind: "health" as const,
    label: "Vida",
    id: "health",
    description:
      "Espessa e morna, com cheiro de ferro velho. Fecha em segundos o corte que a sua " +
      "própria cura levaria a noite inteira para costurar.",
    effect: (ratio: number) => ({ healthRatio: ratio }),
  },
  {
    kind: "rage" as const,
    label: "Fúria",
    id: "rage",
    description:
      "Não pergunte do que é feita: ninguém que responde ainda está por aí. Acende a fera " +
      "sem esperar a lua, e por alguns minutos a coleira fica com quem bebeu.",
    effect: (ratio: number) => ({ rageRatio: ratio }),
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
    effect: line.effect(tier.ratio),
    potion: line.kind,
    size: tier.size,
  })),
);
