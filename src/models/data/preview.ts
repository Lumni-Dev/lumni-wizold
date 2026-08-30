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
    image: "/assets/landing/character.webp?v=5",
  },
  {
    key: "inventory",
    label: "Inventário",
    title: "Sete espaços e uma mochila honesta",
    text:
      "Capacete, colar, armadura, calças, botas, luvas e anel: uma peça por espaço, e o que a " +
      "peça promete é exatamente o que a ficha soma. O que foi forjado carrega o +X na arte.",
    image: "/assets/landing/inventory.webp?v=5",
  },
  {
    key: "hunt",
    label: "Caça",
    title: "Seis territórios, e só a fera sobe a trilha",
    text:
      "A caçada roda em rodadas, narrada golpe a golpe, e a presa cresce junto com você dentro " +
      "da faixa do território. Transforme-se antes: em pele humana o campo recusa.",
    image: "/assets/landing/hunt.webp?v=5",
  },
  {
    key: "pet",
    label: "Mascote",
    title: "Um lobo do seu lado, com ladder própria",
    text:
      "Adotado uma vez, para sempre: ele morde na caçada, empresta atributos enquanto acompanha " +
      "e sobe os próprios níveis no pátio. A energia é o único fôlego dele; comida ou repouso devolvem.",
    image: "/assets/landing/pet.webp?v=5",
  },
  {
    key: "market",
    label: "Mercado",
    title: "Cinco conjuntos, sete peças cada",
    text:
      "Do bronze ao lunar, e uma peça só empresta atributo: o que o card promete é exatamente o " +
      "que a ficha soma e o que a luta lê. O resto é forja, mina e paciência.",
    image: "/assets/landing/market.webp?v=5",
  },
  {
    key: "forge",
    label: "Forja",
    title: "A bigorna bate na peça que você já usa",
    text:
      "A mina abre os veios, o fragmento certo alimenta a marreta, e cada nível forjado soma " +
      "ponto e porcentagem à peça. O nível pertence à peça: tirar do corpo não desfaz o trabalho.",
    image: "/assets/landing/forge.webp?v=5",
  },
];
