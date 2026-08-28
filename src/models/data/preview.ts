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
      "Cada atributo mostra de onde veio cada ponto: treino, equipamento, lobo, lua e fera em " +
      "colunas separadas. Some com o dedo e você chega no total.",
    image: "/assets/landing/character.webp",
  },
  {
    key: "training",
    label: "Treinamento",
    title: "Um exercício para cada atributo",
    text:
      "Só a fera treina, uma sessão por clique e bronze a cada uma: é o único jeito de mover um " +
      "atributo. Subir de nível não dá poder, dá permissão.",
    image: "/assets/landing/training.webp",
  },
  {
    key: "hunt",
    label: "Caça",
    title: "Seis territórios, e só a fera sobe a trilha",
    text:
      "A caçada roda em rodadas, narrada golpe a golpe, e a presa cresce junto com você dentro " +
      "da faixa do território. Transforme-se antes: em pele humana o campo recusa.",
    image: "/assets/landing/hunt.webp",
  },
  {
    key: "market",
    label: "Mercado",
    title: "Cinco conjuntos, sete peças cada",
    text:
      "Do bronze ao lunar, e uma peça só empresta atributo: o que o card promete é exatamente o " +
      "que a ficha soma e o que a luta lê. O resto é forja, mina e paciência.",
    image: "/assets/landing/market.webp",
  },
];
