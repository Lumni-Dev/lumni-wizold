import type { SetDefinition } from "./types";

// O set de Ouro, comprado a partir do NV 401. Cobre as áreas 5 e 6.
export const goldSet: SetDefinition = {
  key: "gold",
  label: "Ouro",
  suffixMasculine: "de Ouro",
  suffixFeminine: "de Ouro",
  rarity: "rare",
  minLevel: 401,
  inMarket: true,
  description: "Conjunto de quem já tem bronze sobrando e territórios abertos.",
  flavor:
    "Ouro trabalhado, mais firme do que a fama sugere e o único que a fera não tenta " +
    "arrancar do corpo na virada. Só desce da serra o que a serra devolve.",
  power: 500,
  priceMultiplier: 4,
};
