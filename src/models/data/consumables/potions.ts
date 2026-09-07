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
    name: SIZE_LABEL[tier.size] + " Health Potion",
    description:
      "Thick and warm, smelling of old iron. It closes in seconds the cut your own " +
      "healing would take the whole night to stitch.",
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
    name: SIZE_LABEL[tier.size] + " Fury Potion",
    description:
      "It gives nothing back to the body: it lights the beast from within. While it " +
      "lasts, +10 to every attribute, and how long it lasts depends on the flask's size and your Willpower.",
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
