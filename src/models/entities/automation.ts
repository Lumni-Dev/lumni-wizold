export interface Automation {
  hunt: boolean;
  train: boolean;
  mine: boolean;
  forge: boolean;
  rest: boolean;
  transform: boolean;
  potion: boolean;
  petFeed: boolean;
  petRest: boolean;
}

export type AutomationKey = keyof Automation;

export const AUTOMATIONS: readonly { key: AutomationKey; label: string; effect: string }[] = [
  {
    key: "hunt",
    label: "Caçada automática",
    effect:
      "Encadeia caçadas sozinho e volta a caçar quando o corpo estiver inteiro de novo. Desligado, cada clique caça uma vez.",
  },
  {
    key: "train",
    label: "Treino automático",
    effect:
      "Repete o exercício sozinho e volta a ele quando o bronze der para pagar. Desligado, cada clique treina uma sessão.",
  },
  {
    key: "mine",
    label: "Mineração automática",
    effect:
      "Repete o golpe na veia sozinho e volta a ela quando a picareta puder bater de novo. Desligado, cada clique rende uma vez.",
  },
  {
    key: "forge",
    label: "Forja automática",
    effect:
      "Bate de novo na mesma peça assim que os fragmentos aparecerem. Desligado, cada clique sobe um nível e para.",
  },
  {
    key: "rest",
    label: "Descanso automático",
    effect: "Deita sozinho quando a vida chega no chão, e levanta quando ela enche.",
  },
  {
    key: "transform",
    label: "Fúria automática",
    effect:
      "Bebe poção de fúria da mochila quando houver, antes de uma caçada ou duelo difícil; na lua cheia o céu já mantém o Modo Fúria. Desligado, você bebe na mão.",
  },
  {
    key: "potion",
    label: "Poção automática",
    effect: "Bebe poção de vida quando a vida chega no chão, se houver uma na mochila.",
  },
  {
    key: "petFeed",
    label: "Alimento automático",
    effect: "Dá comida ao lobo quando ele fica sem fôlego, se houver alguma na mochila.",
  },
  {
    key: "petRest",
    label: "Repouso automático",
    effect:
      "Sem fôlego, dá comida ao lobo se houver na mochila, senão o manda repousar, e o chama de volta quando a energia enche.",
  },
];

export function noAutomation(): Automation {
  return {
    hunt: false,
    train: false,
    mine: false,
    forge: false,
    rest: false,
    transform: false,
    potion: false,
    petFeed: false,
    petRest: false,
  };
}

export function fillAutomation(data: unknown): Automation {
  const saved = (typeof data === "object" && data !== null ? data : {}) as Partial<Automation>;
  const base = noAutomation();

  for (const key of Object.keys(base) as AutomationKey[]) {
    if (typeof saved[key] === "boolean") base[key] = saved[key];
  }

  return base;
}
