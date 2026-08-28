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
      "Foi combinado no alto do Campo do Vilarejo, longe da fumaça das casas, onde o capim cresce " +
      "alto o bastante para esconder duas pessoas que ainda não queriam ser vistas juntas. Luna " +
      "chegou antes, como sempre chegava, e ficou de pé no escuro contando os próprios batimentos. " +
      "Lumni subiu a trilha devagar, ensaiando na boca uma frase que nunca chegou a dizer. Ela riu " +
      "antes de ele começar, e o riso resolveu o que a frase não resolveria. Ficaram ali, ombro com " +
      "ombro, falando baixo de coisas pequenas, porque a coisa grande não cabia em palavra nenhuma. " +
      "Foi ela quem reparou primeiro: a lua tinha subido inteira atrás da serra, branca demais, " +
      "perto demais, olhando.",
    voice: "/assets/voice/meeting.mp3?v=2",
  },
  {
    title: "A virada",
    text:
      "A dor veio nos dois ao mesmo tempo, e é essa a parte que ninguém no vilarejo aceita. Não " +
      "houve mordida, não houve maldição comprada em feira. Havia só o sangue que os dois " +
      "carregavam desde que nasceram, esperando uma lua cheia para lembrar o que era. Os ossos " +
      "viraram, a voz virou, e o capim que os escondia ficou pequeno. Ele quis correr para longe " +
      "dela e não conseguiu. Ela quis gritar, e o que saiu foi um uivo. Então, no meio do pavor, os " +
      "dois se reconheceram: não pelo rosto, que já não havia, mas pelo cheiro, que continuava " +
      "sendo o mesmo de antes.",
    voice: "/assets/voice/turning.mp3?v=2",
  },
  {
    title: "A escolha",
    text:
      "Podiam ter descido a serra em direções opostas e nunca mais se falado. Era o que a prudência " +
      "mandava, e no vilarejo a prudência tem nome de fé. Ficaram. Caçaram juntos até o céu " +
      "clarear, e quando o corpo voltou ao que era, voltou sujo, tremendo e de mãos dadas. " +
      "Aprenderam a voltar antes do primeiro galo, a esconder a roupa rasgada, a mentir bem para " +
      "quem perguntava pouco. E passaram a contar os dias pela lua, nunca mais pelo calendário do " +
      "padre, porque só a lua sabia quando os dois poderiam ser inteiros de novo.",
    voice: "/assets/voice/choice.mp3?v=2",
  },
  {
    title: "A matilha",
    text:
      "Depois vieram outros, como sempre vêm. Uns nascidos assim, sem entender por que a lua cheia " +
      "dói. Outros com a marca ainda fresca e ninguém para explicar. Chegavam com medo de si " +
      "mesmos, e era Luna quem os recebia na porta. Ela ensinou a segurar a fera até a hora certa; " +
      "ele ensinou que existe uma hora certa. A matilha que hoje enche a taverna começou naquela " +
      "noite, no alto do campo, com duas pessoas que só queriam conversar e acabaram tendo que " +
      "inventar um jeito de viver. A lua ainda sobe. Ela ainda cobra. E ninguém, em noite nenhuma, " +
      "caça sozinho.",
    voice: "/assets/voice/pack.mp3?v=2",
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
