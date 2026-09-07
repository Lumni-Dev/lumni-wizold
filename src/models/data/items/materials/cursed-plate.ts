import type { Item } from "../../../entities/item";

export const cursedPlate: Item = {
  id: "cursed-plate",
  name: "Cursed Plate",
  description:
    "Spoils of the hunt. Worth the bronze the market pays for it; no use as a weapon or an ornament.",
  category: "material",
  rarity: "rare",
  price: 200,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
