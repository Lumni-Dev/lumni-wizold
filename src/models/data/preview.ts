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
      "Atributos, forma, lobo e combate na mesma tela, com a origem de cada ponto separada: " +
      "treino, equipamento, mascote, lua e fúria.",
    image: "/assets/landing/character.webp?v=9",
  },
  {
    key: "hunt",
    label: "Caça",
    title: "Seis territórios, narrados ao vivo",
    text:
      "A trilha enche, a presa responde e a luta desce linha a linha. Só a fera caça: " +
      "em pele humana o campo recusa.",
    image: "/assets/landing/hunt.webp?v=9",
  },
  {
    key: "training",
    label: "Treino",
    title: "Cinco exercícios, uma vida inteira",
    text:
      "Cada atributo tem o seu pátio, a sessão cobra WCoins e o ganho acompanha o nível " +
      "sem presente escondido na faixa.",
    image: "/assets/landing/training.webp?v=9",
  },
  {
    key: "market",
    label: "Mercado",
    title: "Balcão de peças e poções",
    text:
      "Cinco sets sobem faixa a faixa, poções cobradas em caçadas da sua noite e uma cópia " +
      "de cada peça: o que já está na mochila ou no corpo o balcão recusa.",
    image: "/assets/landing/market.webp?v=1",
  },
  {
    key: "forge",
    label: "Forja",
    title: "Veia, fragmento e martelo",
    text:
      "A mina abre os veios por faixa, a bigorna bate na peça que você já usa e cada +1 " +
      "permanece na peça, não no slot.",
    image: "/assets/landing/forge.webp?v=9",
  },
  {
    key: "arena",
    label: "Arena",
    title: "Fosso contra caçadores reais",
    text:
      "Adversário do ranking, prêmio em WCoins na bolsa dele e replay da luta na mesma " +
      "cadência da caça.",
    image: "/assets/landing/arena.webp?v=9",
  },
  {
    key: "tavern",
    label: "Taverna",
    title: "Mesas que não esperam refresh",
    text:
      "Salas abertas ou trancadas, mensagens ao vivo, convite de matilha e aviso quando " +
      "a cadeira acende.",
    image: "/assets/landing/tavern.webp?v=9",
  },
];
