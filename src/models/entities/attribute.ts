export type AttributeKey = "strength" | "agility" | "endurance" | "instinct" | "willpower";

export type Attributes = Record<AttributeKey, number>;

export interface AttributeDefinition {
  key: AttributeKey;
  name: string;
  code: string;
  description: string;
  effect: string;
}

export const ATTRIBUTES: readonly AttributeDefinition[] = [
  {
    key: "strength",
    name: "Strength",
    code: "STR",
    description: "It is your blow. The higher, the more health each attack takes.",
    effect:
      "The damage of a blow is Strength x Strength divided by Strength plus the target's Endurance. Training, equipment, companion and Fury Mode add here.",
  },
  {
    key: "agility",
    name: "Agility",
    code: "AGI",
    description: "Your dodge. The higher, the more blows pass without touching you.",
    effect:
      "Dodge is 35 x Agility divided by Agility plus 120, so it climbs toward the 35% ceiling and every point still buys something. Whoever has more Agility than the other attacks first.",
  },
  {
    key: "endurance",
    name: "Endurance",
    code: "END",
    description: "Your defense. The higher, the less each enemy blow hurts.",
    effect:
      "Endurance enters the count of the damage you take: the higher, the less each enemy blow removes. Maximum health is fixed and does not rise with it.",
  },
  {
    key: "instinct",
    name: "Instinct",
    code: "INS",
    description: "Your critical chance, the blow that hurts far more.",
    effect:
      "The critical is 5 plus 40 x Instinct divided by Instinct plus 250, toward the 45% ceiling. A critical multiplies the damage by 1.85, fixed.",
  },
  {
    key: "willpower",
    name: "Willpower",
    code: "WIL",
    description: "How long you hold the beast and how fast the body mends. It stretches the fury potion and speeds up health recovery.",
    effect:
      "The fury potion lasts the flask's time multiplied by 1 plus Willpower divided by Willpower plus 250, toward double: a medium 5 min flask goes past 6.4 min with 100 Willpower and past 8.4 min with 550. The count reads the whole sheet's Willpower, so necklace and ring also stretch the flask. The full moon's fury does not change, it lasts what the sky says. Willpower also speeds up Recover: rest gives back 5% of health per tick with no Willpower and climbs toward 10%, with half that gain already at 400 Willpower, so the more Willpower, the less time until the body is whole.",
  },
] as const;

export function emptyAttributes(): Attributes {
  return { strength: 0, agility: 0, endurance: 0, instinct: 0, willpower: 0 };
}

export function addAttributes(base: Attributes, extra: Partial<Attributes>): Attributes {
  return {
    strength: base.strength + (extra.strength ?? 0),
    agility: base.agility + (extra.agility ?? 0),
    endurance: base.endurance + (extra.endurance ?? 0),
    instinct: base.instinct + (extra.instinct ?? 0),
    willpower: base.willpower + (extra.willpower ?? 0),
  };
}

export function findAttribute(key: AttributeKey): AttributeDefinition | undefined {
  return ATTRIBUTES.find((attribute) => attribute.key === key);
}
