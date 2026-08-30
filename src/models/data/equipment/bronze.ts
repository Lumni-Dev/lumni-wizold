import type { SetDefinition } from "./types";

// O primeiro set, comprado no mercado a partir do NV 1. Cobre as áreas 1 e 2.
export const bronzeSet: SetDefinition = {
  key: "bronze",
  label: "Bronze",
  suffixMasculine: "de Bronze",
  suffixFeminine: "de Bronze",
  rarity: "common",
  minLevel: 1,
  inMarket: true,
  description: "O primeiro conjunto. Barato, pesado e suficiente para o Campo do Vilarejo.",
  flavor:
    "Bronze bruto, martelado sem capricho nenhum. O ferreiro do vilarejo faz um por " +
    "tarde e nunca pergunta por que a encomenda vem sempre dois números maior.",
  power: 20,
  priceMultiplier: 2,
};
