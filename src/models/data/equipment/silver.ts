import type { SetDefinition } from "./types";

// O set de Metal (chave "silver" no código, para não renomear ids dentro de saves).
// Forjado do que se tira dos caçadores. Cobre as áreas 3 e 4.
export const silverSet: SetDefinition = {
  key: "silver",
  label: "Metal",
  suffixMasculine: "de Metal",
  suffixFeminine: "de Metal",
  rarity: "uncommon",
  minLevel: 201,
  inMarket: true,
  description: "Metal de verdade, do tipo que a fera não recusa no corpo.",
  flavor:
    "Chapa batida a frio e forrada de couro por dentro, sem uma linha de prata em lugar " +
    "nenhum. Foi arrancada dos caçadores e refundida até não sobrar nada do que ardia.",
  power: 160,
  priceMultiplier: 8,
};
