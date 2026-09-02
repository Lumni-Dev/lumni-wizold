import { STORE } from "@/shared/config/economy";

export interface StorePack {
  id: string;
  name: string;
  description: string;
  bronze: number;
  priceCents: number;
  highlight: boolean;
}

export const STORE_PACKS: readonly StorePack[] = [
  {
    id: "one-pouch",
    name: "Uma Bolsa de WCoins",
    description:
      "Um empurrão curto para fechar a compra que falta, sem a noite de caça que pagaria por ela.",
    bronze: STORE.onePouch,
    priceCents: 490,
    highlight: false,
  },
  {
    id: "two-pouches",
    name: "Duas Bolsas de WCoins",
    description:
      "A bolsa do meio: dá para mudar de equipamento no meio da escalada sem parar de treinar.",
    bronze: STORE.twoPouches,
    priceCents: 1990,
    highlight: true,
  },
  {
    id: "three-pouches",
    name: "Três Bolsas de WCoins",
    description:
      "A maior bolsa da loja, com folga de bigorna depois da compra. É o atalho mais longo que ela vende.",
    bronze: STORE.threePouches,
    priceCents: 4990,
    highlight: false,
  },
];

export function findPack(id: string): StorePack | undefined {
  return STORE_PACKS.find((pack) => pack.id === id);
}
