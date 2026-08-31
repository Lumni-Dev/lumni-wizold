export interface StorePack {
  id: string;
  name: string;
  description: string;
  hunts: number;
  priceCents: number;
  highlight: boolean;
}

export const STORE_PACKS: readonly StorePack[] = [
  {
    id: "one-pouch",
    name: "Uma Bolsa de WCoins",
    description:
      "Uma noite de caça que você não precisa caçar. Serve para fechar o conjunto que está faltando uma peça.",
    hunts: 25,
    priceCents: 490,
    highlight: false,
  },
  {
    id: "two-pouches",
    name: "Duas Bolsas de WCoins",
    description:
      "Meia semana de noites, de uma vez. Dá para trocar de conjunto no meio da faixa sem parar de treinar.",
    hunts: 125,
    priceCents: 1990,
    highlight: true,
  },
  {
    id: "three-pouches",
    name: "Três Bolsas de WCoins",
    description:
      "O conjunto inteiro da sua faixa e ainda sobra para a bigorna. É o atalho mais longo que a loja vende.",
    hunts: 400,
    priceCents: 4990,
    highlight: false,
  },
];

export function findPack(id: string): StorePack | undefined {
  return STORE_PACKS.find((pack) => pack.id === id);
}
