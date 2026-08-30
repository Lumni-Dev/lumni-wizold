export interface NavigationItem {
  href: string;
  label: string;
  code: string;
  description: string;
}

export const NAVIGATION: readonly NavigationItem[] = [
  { href: "/character", label: "Personagem", code: "PS", description: "Ficha, atributos e forma" },
  {
    href: "/inventory",
    label: "Inventário",
    code: "IV",
    description: "Itens, equipamento e consumo",
  },
  { href: "/training", label: "Treinamento", code: "TR", description: "Evolução dos atributos" },
  { href: "/hunt", label: "Caça", code: "CA", description: "Territórios e combate" },
  { href: "/arena", label: "Arena", code: "AR", description: "Duelos contra outros lobisomens" },

  { href: "/pet", label: "Mascote", code: "MS", description: "Seu lobo e os suprimentos dele" },
  { href: "/market", label: "Mercado", code: "MC", description: "Compra e venda de itens" },
  {
    href: "/forge",
    label: "Forja",
    code: "FJ",
    description: "Mineração e melhoria de equipamento",
  },
  {
    href: "/bazaar",
    label: "Bazar",
    code: "BZ",
    description: "Troca de peças forjadas entre jogadores",
  },
  {
    href: "/tavern",
    label: "Taverna",
    code: "TV",
    description: "Mesas de conversa entre jogadores",
  },
  { href: "/ranking", label: "Ranking", code: "RK", description: "Os melhores de cada número" },
  { href: "/wiki", label: "Wiki", code: "WK", description: "Regras, bestiário e catálogo" },
] as const;

export const STORE_LINK: NavigationItem = {
  href: "/store",
  label: "Wizold Store",
  code: "LS",
  description: "Pacotes de bronze por dinheiro",
};

export const SETTINGS_LINK: NavigationItem = {
  href: "/settings",
  label: "Configurações",
  code: "CF",
  description: "Conta, nome e partida",
};
