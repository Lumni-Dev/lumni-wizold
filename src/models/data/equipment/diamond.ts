import type { SetDefinition } from "./types";

// O set de Diamante, comprado a partir do NV 601. Cobre as áreas 7 e 8.
export const diamondSet: SetDefinition = {
  key: "diamond",
  label: "Diamante",
  suffixMasculine: "de Diamante",
  suffixFeminine: "de Diamante",
  rarity: "epic",
  minLevel: 601,
  inMarket: true,
  description: "O melhor que o mercado do vilarejo consegue oferecer.",
  flavor:
    "Cravejado de diamante, devolve a lua inteira no meio da mata e corta a luz antes " +
    "de cortar carne. É o limite do que o vilarejo monta sem começar a perguntar.",
  power: 1150,
  priceMultiplier: 15,
};
