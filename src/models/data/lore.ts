export interface LoreChapter {
  title: string;
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
