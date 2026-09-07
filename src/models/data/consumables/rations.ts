import type { Item } from "@/models/entities/item";

export const PET_SUPPLIES: readonly Item[] = [
  {
    id: "pet-ration",
    name: "Companion Food",
    description:
      "Dried meat, ground bone and a handful of herbs that disguise the rest. " +
      "It gives back the wolf's breath, which is what it spends walking beside you.",
    category: "pet",
    rarity: "common",
    price: 2,
    huntCost: 1.5,
    minLevel: 1,
    stackable: true,
    inMarket: true,
    effect: { petEnergyRatio: 0.25 },
  },
];
