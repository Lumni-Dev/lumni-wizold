import type { Locale } from "@/shared/i18n/locale";
import {
  LORE_CHAPTERS,
  LORE_COMPANIONS,
  LORE_COUPLE,
  LORE_PILLARS,
  WELCOME_PARAGRAPHS,
  WELCOME_VOICE,
  type LoreChapter,
  type LoreCompanion,
  type LorePillar,
} from "./lore";

interface LoreCoupleText {
  male: { name: string; title: string };
  female: { name: string; title: string };
}

export interface LorePack {
  couple: LoreCoupleText;
  chapters: readonly LoreChapter[];
  companions: readonly LoreCompanion[];
  pillars: readonly LorePillar[];
}

// English is the source in lore.ts; these are the Portuguese and Spanish packs.
// The unsuffixed voice file is the Portuguese recording, so pt keeps the base
// path and en/es derive their ".en"/".es" files.
const PT_CHAPTERS: readonly { title: string; text: string }[] = [
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
  },
];

const ES_CHAPTERS: readonly { title: string; text: string }[] = [
  {
    title: "El encuentro",
    text:
      "Toda historia que importa empieza con alguien esperando en la oscuridad. Luna subió a lo " +
      "alto del campo cuando la aldea aún rezaba, y se quedó entre la hierba alta contando sus " +
      "propios latidos. Lumni llegó después, despacio por el sendero, trayendo en la boca una " +
      "frase ensayada que el viento se llevó antes de tiempo. Ella rió, y la risa resolvió lo " +
      "que la frase no resolvería. Quedaron hombro con hombro, hablando bajo de cosas pequeñas, " +
      "porque la grande no cabía en palabra alguna. Fue ella quien lo vio primero: la luna había " +
      "subido entera detrás de la sierra, demasiado blanca, demasiado cerca, mirando a los dos " +
      "como quien reconoce una deuda antigua.",
  },
  {
    title: "La transformación",
    text:
      "El dolor llegó a los dos al mismo tiempo, y esa es la parte que la aldea nunca aceptó. No " +
      "hubo mordida, ni maldición comprada en feria: estaba la sangre antigua que los dos " +
      "llevaban desde la cuna, esperando una luna llena para recordar lo que era. Lumni soltó " +
      "primero. Los huesos giraron, la voz se volvió aullido, y la bestia partió campo adentro " +
      "sin esperar nombre. Luna sostuvo la suya lo bastante para verlo desaparecer; entonces " +
      "entendió que sostener también es elegir, y soltó, para que él no cruzara la primera noche " +
      "solo. En la oscuridad se reconocieron por el olor, que seguía siendo el mismo de antes.",
  },
  {
    title: "La elección",
    text:
      "Podían haber bajado la sierra en direcciones opuestas y no mirarse nunca más. Era lo que " +
      "mandaba la prudencia, y en la aldea la prudencia lleva nombre de fe. Se quedaron. Cazaron " +
      "juntos hasta que el cielo aclaró, y el cuerpo volvió a lo que era: sucio, temblando y de " +
      "la mano. De aquella noche salieron las primeras leyes, dichas bajito antes del primer " +
      "gallo: esconder la ropa rasgada, mentir bien a quien pregunta poco, y contar los días por " +
      "la luna, nunca por el calendario del cura, porque solo ella sabía cuándo los dos podrían " +
      "estar enteros de nuevo.",
  },
  {
    title: "La manada",
    text:
      "Después vinieron otros, como siempre vienen. Unos nacidos así, sin entender por qué la " +
      "luna llena duele; otros con la marca aún fresca y nadie que explicara. Llegaban con miedo " +
      "de sí mismos, y era Luna quien abría la puerta. Ella enseñaba a sostener la bestia hasta " +
      "la hora justa; Lumni enseñaba que la hora justa existe, y que cada noche de caza llega. " +
      "La manada que hoy llena la taberna empezó allí, en lo alto del campo, con dos que solo " +
      "querían conversar. La luna aún sube. Aún cobra. Y nadie, en noche alguna, caza solo.",
  },
];

const PT_COMPANIONS: readonly { title: string; text: string }[] = [
  {
    title: "O que fica na frente",
    text:
      "O primeiro veio sozinho, sem coleira e sem dono, e sentou na entrada do cercado como " +
      "quem espera há muito tempo. Peito largo, passo pesado, olhos que não desviavam. Naquela " +
      "noite a fera desceu ao campo e ele foi junto, sem rosnar e sem recuar: pôs o corpo entre " +
      "o caçador e a criatura, e levou a primeira investida no lugar do ombro que devia " +
      "levá-la. Amanheceu sujo, respirando fundo, vivo. Desde então a matilha entende o " +
      "acordo. Ele não persegue o rastro nem escolhe a presa. Ele fica na frente, e ficar na " +
      "frente já é a parte mais difícil da noite.",
  },
  {
    title: "A que acha o rastro",
    text:
      "A outra ninguém viu chegar, e é justamente esse o ponto. Magra, silenciosa, sempre três " +
      "passos adiante, achava o rastro antes de o caçador saber que havia rastro. Farejava o " +
      "vento, parava, esperava a fera alcançá-la, e seguia de novo. Contam que numa noite de " +
      "lua nova, quando nem Lumni enxergava a trilha, foi ela quem abriu caminho no escuro e " +
      "trouxe a matilha inteira de volta ao campo. Não briga por espaço e não pede nada. Anda " +
      "na frente porque é de lá que se vê primeiro, e volta sempre, porque escolheu de quem " +
      "quer estar perto.",
  },
];

const ES_COMPANIONS: readonly { title: string; text: string }[] = [
  {
    title: "El que se queda al frente",
    text:
      "El primero llegó solo, sin collar y sin dueño, y se sentó a la entrada del cercado como " +
      "quien espera desde hace mucho. Pecho ancho, paso pesado, ojos que no se desviaban. " +
      "Aquella noche la bestia bajó al campo y él fue también, sin gruñir y sin retroceder: puso " +
      "el cuerpo entre el cazador y la criatura, y recibió la primera embestida en lugar del " +
      "hombro que debía recibirla. Amaneció sucio, respirando hondo, vivo. Desde entonces la " +
      "manada entiende el acuerdo. Él no persigue el rastro ni elige la presa. Se queda al " +
      "frente, y quedarse al frente ya es la parte más difícil de la noche.",
  },
  {
    title: "La que encuentra el rastro",
    text:
      "A la otra nadie la vio llegar, y ese es justamente el punto. Delgada, silenciosa, siempre " +
      "tres pasos adelante, encontraba el rastro antes de que el cazador supiera que había " +
      "rastro. Olfateaba el viento, se detenía, esperaba a que la bestia la alcanzara, y seguía " +
      "de nuevo. Cuentan que en una noche de luna nueva, cuando ni Lumni veía el sendero, fue " +
      "ella quien abrió camino en la oscuridad y trajo a la manada entera de vuelta al campo. No " +
      "pelea por espacio y no pide nada. Camina al frente porque desde allí se ve primero, y " +
      "vuelve siempre, porque eligió de quién quiere estar cerca.",
  },
];

const PT_PILLARS: readonly LorePillar[] = [
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

const ES_PILLARS: readonly LorePillar[] = [
  {
    title: "Cazar",
    text:
      "Seis territorios que se abren conforme subes, y presas que crecen contigo: la cacería " +
      "nunca se vuelve banal y nunca sale gratis.",
  },
  {
    title: "Entrenar",
    text:
      "Cinco atributos, un ejercicio para cada uno y nada que suba solo. El nivel abre puertas, " +
      "pero quien golpea más fuerte es quien entrenó.",
  },
  {
    title: "Forjar",
    text:
      "Baja a la mina por fragmentos y golpea la pieza que ya llevas en el cuerpo, de más uno en " +
      "adelante, hasta donde aguante el bronce.",
  },
  {
    title: "La manada",
    text:
      "Taberna con mesas reservadas, un tablero con los mejores de cada número y un foso donde " +
      "dos hombres lobo lo resuelven a mano.",
  },
];

const PT_WELCOME: readonly string[] = [
  "Você cruzou a porta. Este é o seu lugar na noite.",
  "Na ficha você vê o corpo, a fúria e o que a Vontade segura. Na caça, só a fera sai: junte a fúria, vire, e volte antes do relógio acabar. O pátio treina o que o nível não dá. A mina e a forja pagam o metal. O mercado e o bazar trocam o que você carrega. O fosso mede iguais. A taverna é mesa e matilha.",
  "Antes de tudo, abra as Configurações. Lá você liga ou corta o som e a trilha, e escolhe o volume da música. Lá você decide se o fundo vive em vídeo ou fica parado, e o quão fechado fica o véu da tela. Lá a Taverna pode avisar no aparelho quando a mesa fala. E lá estão as chaves da automação: caçar, treinar, minerar, forjar, beber e cuidar do lobo sem você ficar em cima de cada volta.",
  "Nada liga sozinho. Cada chave é sua. Quando a noite estiver do seu jeito, a porta já não precisa de guia.",
];

const ES_WELCOME: readonly string[] = [
  "Cruzaste la puerta. Este es tu lugar en la noche.",
  "En la ficha ves el cuerpo, la furia y lo que la Voluntad sostiene. En la caza solo sale la bestia: junta la furia, transfórmate y vuelve antes de que acabe el reloj. El patio entrena lo que el nivel no da. La mina y la forja pagan el metal. El mercado y el bazar cambian lo que llevas. El foso mide a iguales. La taberna es mesa y manada.",
  "Antes de todo, abre la Configuración. Allí enciendes o cortas el sonido y la banda sonora, y eliges el volumen de la música. Allí decides si el fondo vive en video o queda quieto, y qué tan cerrado queda el velo de la pantalla. Allí la Taberna puede avisar en tu dispositivo cuando la mesa habla. Y allí están las llaves de la automatización: cazar, entrenar, minar, forjar, beber y cuidar del lobo sin que estés encima de cada vuelta.",
  "Nada se enciende solo. Cada llave es tuya. Cuando la noche esté a tu manera, la puerta ya no necesita guía.",
];

export interface WelcomePack {
  title: string;
  paragraphs: readonly string[];
  voice: string;
}

export function welcomePack(locale: Locale): WelcomePack {
  if (locale === "pt") {
    return { title: "Bem-vindo", paragraphs: PT_WELCOME, voice: WELCOME_VOICE };
  }
  if (locale === "es") {
    return {
      title: "Bienvenido",
      paragraphs: ES_WELCOME,
      voice: localizedVoice(WELCOME_VOICE, "es"),
    };
  }
  return {
    title: "Welcome",
    paragraphs: WELCOME_PARAGRAPHS,
    voice: localizedVoice(WELCOME_VOICE, "en"),
  };
}

const COUPLE_TITLES: Record<Exclude<Locale, "en">, LoreCoupleText> = {
  pt: {
    male: { name: LORE_COUPLE.male.name, title: "O que soltou primeiro" },
    female: { name: LORE_COUPLE.female.name, title: "A que soube segurar" },
  },
  es: {
    male: { name: LORE_COUPLE.male.name, title: "El que soltó primero" },
    female: { name: LORE_COUPLE.female.name, title: "La que supo sostener" },
  },
};

function localizedVoice(voice: string, locale: Exclude<Locale, "pt">): string {
  return voice.replace(/\.mp3(\?v=\d+)?$/, "." + locale + ".mp3?v=1");
}

function mergeChapters(
  translated: readonly { title: string; text: string }[],
  locale: Exclude<Locale, "en">,
): readonly LoreChapter[] {
  return LORE_CHAPTERS.map((chapter, index) => ({
    ...chapter,
    ...(translated[index] ?? {}),
    voice: locale === "pt" ? chapter.voice : localizedVoice(chapter.voice, locale),
  }));
}

function mergeCompanions(
  translated: readonly { title: string; text: string }[],
  locale: Exclude<Locale, "en">,
): readonly LoreCompanion[] {
  return LORE_COMPANIONS.map((companion, index) => ({
    ...companion,
    ...(translated[index] ?? {}),
    voice: locale === "pt" ? companion.voice : localizedVoice(companion.voice, locale),
  }));
}

export function lorePack(locale: Locale): LorePack {
  if (locale === "pt") {
    return {
      couple: COUPLE_TITLES.pt,
      chapters: mergeChapters(PT_CHAPTERS, "pt"),
      companions: mergeCompanions(PT_COMPANIONS, "pt"),
      pillars: PT_PILLARS,
    };
  }
  if (locale === "es") {
    return {
      couple: COUPLE_TITLES.es,
      chapters: mergeChapters(ES_CHAPTERS, "es"),
      companions: mergeCompanions(ES_COMPANIONS, "es"),
      pillars: ES_PILLARS,
    };
  }
  return {
    couple: LORE_COUPLE,
    chapters: LORE_CHAPTERS.map((chapter) => ({
      ...chapter,
      voice: localizedVoice(chapter.voice, "en"),
    })),
    companions: LORE_COMPANIONS.map((companion) => ({
      ...companion,
      voice: localizedVoice(companion.voice, "en"),
    })),
    pillars: LORE_PILLARS,
  };
}
