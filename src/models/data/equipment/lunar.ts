import type { SetDefinition } from "./types";

// O último set, Lunar, comprado a partir do NV 801. Cobre as áreas 9 e 10.
export const lunarSet: SetDefinition = {
  key: "lunar",
  label: "Lunar",
  suffixMasculine: "Lunar",
  suffixFeminine: "Lunares",
  rarity: "legendary",
  minLevel: 801,
  inMarket: true,
  description:
    "O último conjunto. Custa uma fortuna no mercado e também sai do corpo de vampiros e unicórnios.",
  flavor:
    "Forjado sob lua cheia, com a fera acordada segurando o martelo. Responde ao céu: " +
    "brilha fraco no escuro e respira junto com quem veste, na noite da virada.",
  power: 12500,
  priceMultiplier: 6,
};
