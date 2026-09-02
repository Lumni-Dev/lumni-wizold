export interface LoreChapter {
  title: string;
  text: string;
  voice: string;
}

export interface LoreCompanion {
  gender: "male" | "female";
  title: string;
  art: string;
  text: string;
  voice: string;
}

export interface LorePillar {
  title: string;
  text: string;
}

export const LORE_COUPLE = {
  male: { name: "Lumni", title: "O que soltou primeiro" },
  female: { name: "Luna", title: "A que soube segurar" },
};

export const LORE_CHAPTERS: readonly LoreChapter[] = [
  {
    title: "O encontro",
    text:
      "Toda história que importa começa com alguém esperando no escuro. Luna subiu ao alto do " +
      "campo quando o vilarejo ainda rezava, e ficou entre o capim alto contando os próprios " +
      "batimentos. Lumni veio depois, devagar pela trilha, trazendo na boca uma frase ensaiada " +
      "que o vento levou antes da hora. Ela riu, e o riso resolveu o que a frase não resolveria. " +
      "Ficaram ombro com ombro, falando baixo de coisas pequenas, porque a grande não cabia em " +
      "palavra nenhuma. Foi ela quem viu primeiro: a lua tinha subido inteira atrás da serra, " +
      "branca demais, perto demais, olhando os dois como quem reconhece uma dívida antiga.",
    voice: "/assets/voice/meeting.mp3?v=3",
  },
  {
    title: "A virada",
    text:
      "A dor veio nos dois ao mesmo tempo, e é essa a parte que o vilarejo nunca aceitou. Não " +
      "houve mordida, nem maldição comprada em feira: havia o sangue antigo que os dois " +
      "carregavam desde o berço, esperando uma lua cheia para lembrar o que era. Lumni soltou " +
      "primeiro. Os ossos viraram, a voz virou uivo, e a fera partiu campo adentro sem esperar " +
      "por nome. Luna segurou a sua o bastante para vê-lo sumir; então entendeu que segurar " +
      "também é escolher, e soltou, para que ele não atravessasse a primeira noite sozinho. No " +
      "escuro, reconheceram-se pelo cheiro, que seguia sendo o mesmo de antes.",
    voice: "/assets/voice/turning.mp3?v=3",
  },
  {
    title: "A escolha",
    text:
      "Podiam ter descido a serra em direções opostas e nunca mais se olhado. Era o que a " +
      "prudência mandava, e no vilarejo a prudência tem nome de fé. Ficaram. Caçaram juntos até " +
      "o céu clarear, e o corpo voltou ao que era: sujo, tremendo e de mãos dadas. Daquela noite " +
      "saíram as primeiras leis, ditas baixinho antes do primeiro galo: esconder a roupa rasgada, " +
      "mentir bem para quem pergunta pouco, e contar os dias pela lua, nunca pelo calendário do " +
      "padre, porque só ela sabia quando os dois poderiam ser inteiros de novo.",
    voice: "/assets/voice/choice.mp3?v=3",
  },
  {
    title: "A matilha",
    text:
      "Depois vieram outros, como sempre vêm. Uns nascidos assim, sem entender por que a lua " +
      "cheia dói; outros com a marca ainda fresca e ninguém para explicar. Chegavam com medo de " +
      "si mesmos, e era Luna quem abria a porta. Ela ensinava a segurar a fera até a hora certa; " +
      "Lumni ensinava que a hora certa existe, e que toda noite de caça ela chega. A matilha que " +
      "hoje enche a taverna começou ali, no alto do campo, com dois que só queriam conversar. A " +
      "lua ainda sobe. Ainda cobra. E ninguém, em noite nenhuma, caça sozinho.",
    voice: "/assets/voice/pack.mp3?v=3",
  },
];

export const LORE_COMPANIONS: readonly LoreCompanion[] = [
  {
    gender: "male",
    title: "O que fica na frente",
    art: "/assets/landing/wolf-male.webp?v=1",
    text:
      "O primeiro veio sozinho, sem coleira e sem dono, e sentou na entrada do cercado como " +
      "quem espera há muito tempo. Peito largo, passo pesado, olhos que não desviavam. Naquela " +
      "noite a fera desceu ao campo e ele foi junto, sem rosnar e sem recuar: pôs o corpo entre " +
      "o caçador e a criatura, e levou a primeira investida no lugar do ombro que devia " +
      "levá-la. Amanheceu sujo, respirando fundo, vivo. Desde então a matilha entende o " +
      "acordo. Ele não persegue o rastro nem escolhe a presa. Ele fica na frente, e ficar na " +
      "frente já é a parte mais difícil da noite.",
    voice: "/assets/voice/guardian.mp3?v=1",
  },
  {
    gender: "female",
    title: "A que acha o rastro",
    art: "/assets/landing/wolf-female.webp?v=1",
    text:
      "A outra ninguém viu chegar, e é justamente esse o ponto. Magra, silenciosa, sempre três " +
      "passos adiante, achava o rastro antes de o caçador saber que havia rastro. Farejava o " +
      "vento, parava, esperava a fera alcançá-la, e seguia de novo. Contam que numa noite de " +
      "lua nova, quando nem Lumni enxergava a trilha, foi ela quem abriu caminho no escuro e " +
      "trouxe a matilha inteira de volta ao campo. Não briga por espaço e não pede nada. Anda " +
      "na frente porque é de lá que se vê primeiro, e volta sempre, porque escolheu de quem " +
      "quer estar perto.",
    voice: "/assets/voice/tracker.mp3?v=1",
  },
];

export const WELCOME_VOICE = "/assets/voice/welcome.mp3?v=1";

export const WELCOME_PARAGRAPHS = [
  "Você cruzou a porta. Este é o seu lugar na noite.",
  "Na ficha você vê o corpo, a fúria e o que a Vontade segura. Na caça, só a fera sai: junte a fúria, vire, e volte antes do relógio acabar. O pátio treina o que o nível não dá. A mina e a forja pagam o metal. O mercado e o bazar trocam o que você carrega. O fosso mede iguais. A taverna é mesa e matilha.",
  "Antes de tudo, abra as Configurações. Lá você liga ou corta o som e a trilha, e escolhe o volume da música. Lá você decide se o fundo vive em vídeo ou fica parado, e o quão fechado fica o véu da tela. Lá a Taverna pode avisar no aparelho quando a mesa fala. E lá estão as chaves da automação: caçar, treinar, minerar, forjar, beber e cuidar do lobo sem você ficar em cima de cada volta.",
  "Nada liga sozinho. Cada chave é sua. Quando a noite estiver do seu jeito, a porta já não precisa de guia.",
] as const;

export const WELCOME_CHAPTER: LoreChapter = {
  title: "Bem-vindo",
  text: WELCOME_PARAGRAPHS.join(" "),
  voice: WELCOME_VOICE,
};

export const LORE_PILLARS: readonly LorePillar[] = [
  {
    title: "Caçar",
    text:
      "Seis territórios que abrem conforme você sobe, e presas que crescem junto: a caçada nunca " +
      "fica banal e nunca fica de graça.",
  },
  {
    title: "Treinar",
    text:
      "Cinco atributos, um exercício para cada e nada que suba sozinho. O nível abre portas, mas " +
      "quem bate mais forte é quem treinou.",
  },
  {
    title: "Forjar",
    text:
      "Desça na mina por fragmentos e bata na peça que já está no corpo, de mais um em diante, " +
      "até onde o bronze aguentar.",
  },
  {
    title: "A matilha",
    text:
      "Taverna com mesas reservadas, um quadro com os melhores de cada número e um fosso onde " +
      "dois lobisomens resolvem no braço.",
  },
];
