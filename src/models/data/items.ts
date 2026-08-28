import { findGender, type Gender } from "../entities/character";
import { SIZE_LABEL, type Item, type PotionSize } from "../entities/item";
import { buildSetItems } from "./equipment-sets";
import { buildMaterials } from "./species";

const POTION_TIERS = [
  { size: "small" as PotionSize, ratio: 0.25, rarity: "common" as const, minLevel: 1, price: 60 },
  {
    size: "medium" as PotionSize,
    ratio: 0.5,
    rarity: "uncommon" as const,
    minLevel: 340,
    price: 2500,
  },
  { size: "large" as PotionSize, ratio: 1, rarity: "rare" as const, minLevel: 670, price: 12000 },
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

const POTIONS: readonly Item[] = POTION_LINES.flatMap((line) =>
  POTION_TIERS.map((tier) => ({
    id: line.id + "-potion-" + tier.size,
    name: "Poção de " + line.label + " " + SIZE_LABEL[tier.size],
    description: line.description,
    category: "potion" as const,
    rarity: tier.rarity,
    price: tier.price,
    minLevel: tier.minLevel,
    stackable: true,
    inMarket: true,
    effect: line.effect(tier.ratio),
    potion: line.kind,
    size: tier.size,
  })),
);

const PET_SUPPLIES: readonly Item[] = [
  {
    id: "pet-ration",
    name: "Alimento para Mascote",
    description:
      "Carne seca, osso moído e um punhado de ervas que disfarçam o resto. " +
      "Devolve o fôlego do lobo, que é o que ele gasta acompanhando você.",
    category: "pet",
    rarity: "common",
    price: 40,
    minLevel: 1,
    stackable: true,
    inMarket: true,
    effect: { petEnergyRatio: 0.5 },
  },
];

const FRAGMENT_LINES = [
  { set: "bronze", label: "Bronze", price: 15, rarity: "common" as const },
  { set: "silver", label: "Metal", price: 60, rarity: "uncommon" as const },
  { set: "gold", label: "Ouro", price: 220, rarity: "rare" as const },
  { set: "diamond", label: "Diamante", price: 700, rarity: "epic" as const },
  { set: "lunar", label: "Lunar", price: 1800, rarity: "legendary" as const },
];

const FRAGMENTS: readonly Item[] = FRAGMENT_LINES.map((line) => ({
  id: line.set + "-fragment",
  name: "Fragmento de " + line.label,
  description:
    "Lasca arrancada do veio de " +
    line.label.toLowerCase() +
    ". Não serve de arma nem de enfeite: serve para a forja bater de novo na peça " +
    "que você já usa, até ela responder melhor do que o corpo.",
  category: "material" as const,
  rarity: line.rarity,
  price: line.price,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
}));

export const ITEMS: readonly Item[] = [
  ...buildSetItems(),
  ...POTIONS,
  ...PET_SUPPLIES,
  ...FRAGMENTS,
  ...buildMaterials(),
];

const ITEM_INDEX = new Map<string, Item>(ITEMS.map((item) => [item.id, item]));

export function itemIdFor(id: string, lineage: Gender): string {
  if (findItem(id)) return id;
  const split = id + "-" + lineage;
  return findItem(split) ? split : id;
}

export function servesLineage(item: Item, lineage: Gender): boolean {
  return item.lineage === undefined || item.lineage === lineage;
}

export function lineageName(item: Item): string {
  return item.lineage ? findGender(item.lineage).label : "";
}

export function findItem(itemId: string): Item | undefined {
  return ITEM_INDEX.get(itemId);
}

export function marketItems(): readonly Item[] {
  return ITEMS.filter((item) => item.inMarket);
}
