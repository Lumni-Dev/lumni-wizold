import type { Item } from "@/models/entities/item";

export const PET_SUPPLIES: readonly Item[] = [
  {
    id: "pet-ration",
    name: "Alimento para Mascote",
    description:
      "Carne seca, osso moído e um punhado de ervas que disfarçam o resto. " +
      "Devolve o fôlego do lobo, que é o que ele gasta acompanhando você.",
    category: "pet",
    rarity: "common",
    price: 40,
    huntCost: 1.5,
    minLevel: 1,
    stackable: true,
    inMarket: true,
    effect: { petEnergyRatio: 0.5 },
  },
];
