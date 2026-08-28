import type { AttributeKey } from "../entities/attribute";
import type { Gender } from "../entities/character";
import {
  EQUIPMENT_SLOTS,
  type EquipmentSet,
  type EquipmentSlot,
  type Item,
  type ItemEffect,
  type Rarity,
} from "../entities/item";

interface SlotBlueprint {
  noun: string;
  feminine: boolean;
  flavor: string;
  attributes: Partial<Record<AttributeKey, number>>;
  priceFactor: number;
}

const SLOTS: Record<EquipmentSlot, SlotBlueprint> = {
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
    noun: "Garras",
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

export interface SetDefinition {
  key: EquipmentSet;
  label: string;
  suffixMasculine: string;
  suffixFeminine: string;
  rarity: Rarity;
  minLevel: number;
  inMarket: boolean;
  description: string;
  flavor: string;
  power: number;
  priceMultiplier: number;
}

export const EQUIPMENT_SETS: readonly SetDefinition[] = [
  {
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
    power: 6,
    priceMultiplier: 1,
  },
  {
    key: "silver",
    label: "Metal",
    suffixMasculine: "de Metal",
    suffixFeminine: "de Metal",
    rarity: "uncommon",
    minLevel: 170,
    inMarket: true,
    description: "Metal de verdade, do tipo que a fera não recusa no corpo.",
    flavor:
      "Chapa batida a frio e forrada de couro por dentro, sem uma linha de prata em lugar " +
      "nenhum. Foi arrancada dos caçadores e refundida até não sobrar nada do que ardia.",
    power: 160,
    priceMultiplier: 6,
  },
  {
    key: "gold",
    label: "Ouro",
    suffixMasculine: "de Ouro",
    suffixFeminine: "de Ouro",
    rarity: "rare",
    minLevel: 340,
    inMarket: true,
    description: "Conjunto de quem já tem bronze sobrando e territórios abertos.",
    flavor:
      "Ouro trabalhado, mais firme do que a fama sugere e o único que a fera não tenta " +
      "arrancar do corpo na virada. Só desce da serra o que a serra devolve.",
    power: 750,
    priceMultiplier: 6,
  },
  {
    key: "diamond",
    label: "Diamante",
    suffixMasculine: "de Diamante",
    suffixFeminine: "de Diamante",
    rarity: "epic",
    minLevel: 505,
    inMarket: true,
    description: "O melhor que o mercado do vilarejo consegue oferecer.",
    flavor:
      "Cravejado de diamante, devolve a lua inteira no meio da mata e corta a luz antes " +
      "de cortar carne. É o limite do que o vilarejo monta sem começar a perguntar.",
    power: 1150,
    priceMultiplier: 8,
  },
  {
    key: "lunar",
    label: "Lunar",
    suffixMasculine: "Lunar",
    suffixFeminine: "Lunares",
    rarity: "legendary",
    minLevel: 670,
    inMarket: true,
    description:
      "O último conjunto. Custa uma fortuna no mercado e também sai do corpo de vampiros e unicórnios.",
    flavor:
      "Forjado sob lua cheia, com a fera acordada segurando o martelo. Responde ao céu: " +
      "brilha fraco no escuro e respira junto com quem veste, na noite da virada.",
    power: 2400,
    priceMultiplier: 5,
  },
];

export function setAttributes(definition: SetDefinition): Record<AttributeKey, number> {
  const total: Record<AttributeKey, number> = {
    strength: 0,
    agility: 0,
    endurance: 0,
    instinct: 0,
    willpower: 0,
  };

  for (const slot of EQUIPMENT_SLOTS) {
    const lent = scaleAttributes(SLOTS[slot].attributes, definition.power) ?? {};
    for (const [key, value] of Object.entries(lent) as [AttributeKey, number][]) {
      total[key] += value;
    }
  }

  return total;
}

export function setForLevel(level: number): SetDefinition {
  let owned = EQUIPMENT_SETS[0];
  for (const definition of EQUIPMENT_SETS) {
    if (definition.minLevel <= level) owned = definition;
  }
  return owned;
}

const LINEAGE_SLOT: EquipmentSlot = "armor";

export function pieceId(set: EquipmentSet, slot: EquipmentSlot, lineage?: Gender): string {
  const base = set + "-" + slot;
  return slot === LINEAGE_SLOT ? base + "-" + (lineage ?? "male") : base;
}

export function pieceName(definition: SetDefinition, slot: EquipmentSlot): string {
  const blueprint = SLOTS[slot];
  const suffix = blueprint.feminine ? definition.suffixFeminine : definition.suffixMasculine;
  return blueprint.noun + " " + suffix;
}

function scaleAttributes(
  shape: Partial<Record<AttributeKey, number>>,
  power: number,
): ItemEffect["attributes"] {
  const result: Partial<Record<AttributeKey, number>> = {};
  for (const [key, fraction] of Object.entries(shape) as [AttributeKey, number][]) {
    result[key] = Math.max(1, Math.round(fraction * power));
  }
  return result;
}

function pieceEffect(definition: SetDefinition, slot: EquipmentSlot): ItemEffect {
  return { attributes: scaleAttributes(SLOTS[slot].attributes, definition.power) };
}

export function piecePrice(definition: SetDefinition, slot: EquipmentSlot): number {
  return Math.round(SLOTS[slot].priceFactor * definition.power * definition.priceMultiplier);
}

function pieceOf(definition: SetDefinition, slot: EquipmentSlot, lineage?: Gender): Item {
  return {
    id: pieceId(definition.key, slot, lineage),
    name: pieceName(definition, slot),
    description: SLOTS[slot].flavor + " " + definition.flavor,
    category: slot,
    rarity: definition.rarity,
    price: piecePrice(definition, slot),
    minLevel: definition.minLevel,
    stackable: false,
    inMarket: definition.inMarket,
    effect: pieceEffect(definition, slot),
    set: definition.key,
    lineage,
  };
}

export function buildSetItems(): Item[] {
  return EQUIPMENT_SETS.flatMap((definition) =>
    EQUIPMENT_SLOTS.flatMap((slot) =>
      slot === LINEAGE_SLOT
        ? [pieceOf(definition, slot, "male"), pieceOf(definition, slot, "female")]
        : [pieceOf(definition, slot)],
    ),
  );
}
