import type { EquipmentSlot } from "@/models/entities/item";
import type { SlotBlueprint } from "./types";

export const SLOTS: Record<EquipmentSlot, SlotBlueprint> = {
  helmet: {
    noun: "Gorro",
    feminine: false,
    flavor:
      "Couro forrado de pele, com as abas amarradas por baixo do queixo. Esconde o que o " +
      "rosto entrega quando a fera começa a subir, e numa noite cheia isso poupa explicação.",
    attributes: { endurance: 0.35, instinct: 0.15 },
    priceFactor: 12,
  },
  necklace: {
    noun: "Colar",
    feminine: false,
    flavor:
      "Pende sobre o peito e mantém o instinto desperto mesmo em forma humana. O metal " +
      "esquenta um instante antes de a presa aparecer, e a matilha aprendeu a confiar nisso.",
    attributes: { instinct: 0.4, willpower: 0.3 },
    priceFactor: 17,
  },
  armor: {
    noun: "Casaco",
    feminine: false,
    flavor:
      "Couro pesado e gola de pele, cobrindo o tronco, que é onde uma fera mira quando " +
      "reconhece outra. É a peça que decide se a mordida vira cicatriz para contar.",
    attributes: { endurance: 0.75 },
    priceFactor: 14,
  },
  pants: {
    noun: "Calças",
    feminine: true,
    flavor:
      "Reforço nas pernas para a corrida de quatro patas e a queda de duas. Numa " +
      "perseguição longa, o que cede primeiro nunca é o braço.",
    attributes: { endurance: 0.45, agility: 0.2 },
    priceFactor: 11,
  },
  boots: {
    noun: "Botas",
    feminine: true,
    flavor:
      "Solado firme para pedra, lama e telhado molhado, e folgado o bastante para o pé " +
      "que cresce na virada. Alcançar é metade da caçada.",
    attributes: { agility: 0.5 },
    priceFactor: 10,
  },
  claw: {
    noun: "Luvas",
    feminine: true,
    flavor:
      "Presas de metal para os dedos, úteis nas noites em que as suas ainda não saíram. " +
      "É o golpe da matilha, e a mão esquece que está armada até ver o estrago.",
    attributes: { strength: 1 },
    priceFactor: 15,
  },
  ring: {
    noun: "Anel",
    feminine: false,
    flavor:
      "Pequeno, discreto, e ainda assim pesa na mão. Aperta o dedo quando a fúria sobe, " +
      "como uma coleira curta lembrando quem manda em quem.",
    attributes: { strength: 0.25, willpower: 0.15 },
    priceFactor: 16,
  },
};
