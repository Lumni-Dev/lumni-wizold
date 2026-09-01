import { STORE } from "@/shared/config/economy";

export interface StorePack {
  id: string;
  name: string;
  description: string;
  setShare: number;
  priceCents: number;
  highlight: boolean;
}

export const STORE_PACKS: readonly StorePack[] = [
  {
    id: "one-pouch",
    name: "Uma Bolsa de WCoins",
    description:
      "O equivalente a uma peça do conjunto da sua faixa, sem a noite de caça que pagaria por ela.",
    setShare: STORE.onePieceShare,
    priceCents: 490,
    highlight: false,
  },
  {
    id: "two-pouches",
    name: "Duas Bolsas de WCoins",
    description:
      "Quase um conjunto inteiro de uma vez: dá para virar a faixa no meio da escalada sem parar de treinar.",
    setShare: STORE.midSetShare,
    priceCents: 1990,
    highlight: true,
  },
  {
    id: "three-pouches",
    name: "Três Bolsas de WCoins",
    description:
      "O conjunto da faixa e folga de bigorna. É o atalho mais longo que a loja vende.",
    setShare: STORE.fullSetShare,
    priceCents: 4990,
    highlight: false,
  },
];

export function findPack(id: string): StorePack | undefined {
  return STORE_PACKS.find((pack) => pack.id === id);
}
