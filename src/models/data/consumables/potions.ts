import { SIZE_LABEL, type Item, type PotionSize } from "@/models/entities/item";
import { FURY } from "@/shared/constants/tuning/fury";

const RAGE_TIERS = [
  {
    size: "small" as PotionSize,
    price: 300,
    rarity: "common" as const,
    minLevel: 1,
  },
  {
    size: "medium" as PotionSize,
    price: 600,
    rarity: "uncommon" as const,
    minLevel: 334,
  },
  {
    size: "large" as PotionSize,
    price: 900,
    rarity: "rare" as const,
    minLevel: 667,
  },
];

const HEALTH_TIERS = [
  {
    size: "small" as PotionSize,
    healthMin: 150,
    healthMax: 200,
    price: 50,
    rarity: "common" as const,
    minLevel: 1,
  },
  {
    size: "medium" as PotionSize,
    healthMin: 200,
    healthMax: 300,
    price: 150,
    rarity: "uncommon" as const,
    minLevel: 334,
  },
  {
    size: "large" as PotionSize,
    healthMin: 300,
    healthMax: 500,
    price: 300,
    rarity: "rare" as const,
    minLevel: 667,
  },
];

export const POTIONS: readonly Item[] = [
  ...HEALTH_TIERS.map((tier) => ({
    id: "health-potion-" + tier.size,
    name: "Poção de Vida " + SIZE_LABEL[tier.size],
    description:
      "Espessa e morna, com cheiro de ferro velho. Fecha em segundos o corte que a sua " +
      "própria cura levaria a noite inteira para costurar.",
    category: "potion" as const,
    rarity: tier.rarity,
    price: tier.price,
    minLevel: tier.minLevel,
    stackable: true,
    inMarket: true,
    effect: { healthMin: tier.healthMin, healthMax: tier.healthMax },
    potion: "health" as const,
    size: tier.size,
  })),
  ...RAGE_TIERS.map((tier) => ({
    id: "rage-potion-" + tier.size,
    name: "Poção de Fúria " + SIZE_LABEL[tier.size],
    description:
      "Não devolve nada ao corpo: acende a fera por dentro. Enquanto dura, +10 em cada " +
      "atributo, e o quanto dura depende do tamanho do frasco.",
    category: "potion" as const,
    rarity: tier.rarity,
    price: tier.price,
    minLevel: tier.minLevel,
    stackable: true,
    inMarket: true,
    effect: { furyMinutes: FURY.durationMinutesBySize[tier.size] },
    potion: "rage" as const,
    size: tier.size,
  })),
];
