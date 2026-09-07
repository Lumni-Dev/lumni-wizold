import type { Item } from "../../../entities/item";

export const leechBlood: Item = {
  id: "leech-blood",
  name: "Leech Blood",
  description:
    "Spoils of the hunt. Worth the bronze the market pays for it; no use as a weapon or an ornament.",
  category: "material",
  rarity: "uncommon",
  price: 50,
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
