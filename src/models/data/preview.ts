export interface PreviewShot {
  key: string;
  label: string;
  title: string;
  text: string;
  image: string;
}

export const PREVIEW_SHOTS: readonly PreviewShot[] = [
  {
    key: "character",
    label: "Personagem",
    title: "A ficha inteira, sem número escondido",
    text:
      "Cada atributo mostra de onde veio cada ponto: treino, equipamento, mascote, lua e " +
      "lobisomem em colunas separadas. Some com o dedo e você chega no total.",
    image: "/assets/landing/character.webp?v=2",
  },
  {
    key: "training",
    label: "Treinamento",
    title: "Um exercício para cada atributo",
    text:
      "Só a fera treina, uma sessão por clique e bronze a cada uma: é o único jeito de mover um " +
      "atributo. Subir de nível não dá poder, dá permissão.",
    image: "/assets/landing/training.webp?v=2",
  },
  {
    key: "hunt",
    label: "Caça",
    title: "Seis territórios, e só a fera sobe a trilha",
    text:
      "A caçada roda em rodadas, narrada golpe a golpe, e a presa cresce junto com você dentro " +
      "da faixa do território. Transforme-se antes: em pele humana o campo recusa.",
    image: "/assets/landing/hunt.webp?v=2",
  },
  {
    key: "arena",
    label: "Arena",
    title: "O fosso: a caça virada contra a matilha",
    text:
      "Outro caçador do plantel no lugar da presa, os dois transformados, golpe a golpe. Três " +
      "duelos por dia e só o bronze troca de mãos: nível se ganha na trilha, nunca no fosso.",
    image: "/assets/landing/arena.webp?v=2",
  },
  {
    key: "market",
    label: "Mercado",
    title: "Cinco conjuntos, sete peças cada",
    text:
      "Do bronze ao lunar, e uma peça só empresta atributo: o que o card promete é exatamente o " +
      "que a ficha soma e o que a luta lê. O resto é forja, mina e paciência.",
    image: "/assets/landing/market.webp?v=2",
  },
];
