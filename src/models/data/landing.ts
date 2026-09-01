export interface LandingHighlight {
  title: string;
  text: string;
}

export interface LandingStep {
  title: string;
  text: string;
}

export interface LandingFeature {
  href: string;
  title: string;
  text: string;
}

export const LANDING_HIGHLIGHTS: readonly LandingHighlight[] = [
  {
    title: "Grátis no navegador",
    text: "Entra com Google, escolhe linhagem e nome. Nada para instalar.",
  },
  {
    title: "Lua de verdade",
    text: "A fase no céu hoje muda experiência e atributos na partida.",
  },
  {
    title: "Mil níveis",
    text: "Seis territórios, cinco conjuntos e uma bigorna que não perdoa.",
  },
  {
    title: "Gente de carne",
    text: "Ranking, taverna, fosso e bazar: a matilha inteira joga junto.",
  },
];

export const LANDING_STEPS: readonly LandingStep[] = [
  {
    title: "Abrir a porta",
    text: "Google, data de nascimento e pronto: a conta abre na hora, sem senha nova.",
  },
  {
    title: "Vestir o nome",
    text: "Lumni ou Luna, um sobrenome de caçador e a primeira peça bronze no mercado.",
  },
  {
    title: "Juntar fúria",
    text: "Descanse, vire fera e caça enquanto o relógio corre: a noite inteira é sua.",
  },
];

export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    href: "/character",
    title: "Ficha aberta",
    text: "Atributos, equipamento, lobo e combate com a origem de cada ponto na mesma tela.",
  },
  {
    href: "/hunt",
    title: "Caça narrada",
    text: "Territórios que abrem com o nível, presa que acompanha a faixa e luta contada golpe a golpe.",
  },
  {
    href: "/training",
    title: "Treino pago",
    text: "Cinco exercícios do primeiro ao milésimo nível; o corpo só sobe se você bancar a sessão.",
  },
  {
    href: "/forge",
    title: "Mina e bigorna",
    text: "Fragmentos no subsolo, nível na peça que já está no corpo e risco de falhar a martelada.",
  },
  {
    href: "/arena",
    title: "Fosso",
    text: "Duelo contra caçadores reais, prêmio em WCoins e limite diário que obriga escolher bem.",
  },
  {
    href: "/tavern",
    title: "Taverna ao vivo",
    text: "Mesas abertas ou trancadas, mensagens na hora e convite de matilha sem sair da cadeira.",
  },
];
