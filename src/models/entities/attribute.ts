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
    name: "Força",
    code: "FOR",
    description: "É o seu golpe. Quanto maior, mais vida cada ataque tira.",
    effect:
      "O dano de um golpe é Força x Força dividido por Força mais a Resistência do alvo. Treino, equipamento, mascote e Modo Fúria somam aqui.",
  },
  {
    key: "agility",
    name: "Agilidade",
    code: "AGI",
    description: "Sua esquiva. Quanto maior, mais golpes passam sem te acertar.",
    effect:
      "A esquiva é 35 x Agilidade dividido por Agilidade mais 120, então ela sobe rumo ao teto de 35% e cada ponto ainda vale alguma coisa. Quem tem mais Agilidade que o outro ataca primeiro.",
  },
  {
    key: "endurance",
    name: "Resistência",
    code: "RES",
    description: "Sua defesa. Quanto maior, menos dói cada golpe do inimigo.",
    effect:
      "A Resistência entra na conta do dano que você sofre: quanto maior, menos cada golpe do inimigo tira. A vida máxima é fixa e não sobe com ela.",
  },
  {
    key: "instinct",
    name: "Instinto",
    code: "INS",
    description: "Sua chance de crítico, o golpe que dói bem mais.",
    effect:
      "O crítico é 5 mais 40 x Instinto dividido por Instinto mais 250, rumo ao teto de 45%. Um crítico multiplica o dano por 1,85, fixo.",
  },
  {
    key: "willpower",
    name: "Vontade",
    code: "VON",
    description: "Disciplina e foco. Sobe pelo treino e pelo colar.",
    effect:
      "Entra na ficha como os demais atributos: treino, equipamento e mascote somam aqui. Modo Fúria (poção ou lua cheia) dá +10 em todos enquanto durar, Vontade incluída.",
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
