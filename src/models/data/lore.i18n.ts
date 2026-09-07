import type { Locale } from "@/shared/i18n/locale";
import {
  LORE_CHAPTERS,
  LORE_COMPANIONS,
  LORE_COUPLE,
  LORE_PILLARS,
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

const EN_CHAPTERS: readonly { title: string; text: string }[] = [
  {
    title: "The meeting",
    text:
      "Every story that matters begins with someone waiting in the dark. Luna climbed to the top " +
      "of the field while the village was still at prayer, and stood in the tall grass counting " +
      "her own heartbeats. Lumni came later, slow along the trail, carrying in his mouth a " +
      "rehearsed line the wind took before its time. She laughed, and the laughter settled what " +
      "the line never would. They stood shoulder to shoulder, speaking low of small things, " +
      "because the big one fit into no word at all. She was the one who saw it first: the moon " +
      "had risen whole behind the ridge, too white, too near, watching the two of them like " +
      "someone recognizing an old debt.",
  },
  {
    title: "The turning",
    text:
      "The pain came to both at the same time, and that is the part the village never accepted. " +
      "There was no bite, no curse bought at a fair: there was the old blood the two had carried " +
      "since the cradle, waiting for a full moon to remember what it was. Lumni let go first. " +
      "The bones turned, the voice turned to howl, and the beast tore off into the field without " +
      "waiting for a name. Luna held hers long enough to watch him vanish; then she understood " +
      "that holding is also choosing, and let go, so he would not cross the first night alone. " +
      "In the dark they knew each other by scent, which was still the same as before.",
  },
  {
    title: "The choice",
    text:
      "They could have gone down the ridge in opposite directions and never looked at each other " +
      "again. That is what prudence ordered, and in the village prudence goes by the name of " +
      "faith. They stayed. They hunted together until the sky lightened, and the body came back " +
      "to what it was: dirty, trembling and holding hands. Out of that night came the first laws, " +
      "spoken low before the first rooster: hide the torn clothes, lie well to those who ask " +
      "little, and count the days by the moon, never by the priest's calendar, because only she " +
      "knew when the two of them could be whole again.",
  },
  {
    title: "The pack",
    text:
      "Then came the others, as they always come. Some born this way, not knowing why the full " +
      "moon hurts; others with the mark still fresh and no one to explain. They arrived afraid " +
      "of themselves, and it was Luna who opened the door. She taught how to hold the beast " +
      "until the right hour; Lumni taught that the right hour exists, and that every hunting " +
      "night it arrives. The pack that fills the tavern today began there, at the top of the " +
      "field, with two who only wanted to talk. The moon still rises. Still collects. And no " +
      "one, on any night, hunts alone.",
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

const EN_COMPANIONS: readonly { title: string; text: string }[] = [
  {
    title: "The one who stands in front",
    text:
      "The first came alone, with no collar and no owner, and sat at the gate of the pen like " +
      "someone who has waited a long time. Broad chest, heavy step, eyes that never looked away. " +
      "That night the beast went down to the field and he went too, without growling and without " +
      "backing off: he put his body between the hunter and the creature, and took the first " +
      "charge in place of the shoulder that was meant to take it. He woke dirty, breathing deep, " +
      "alive. Since then the pack understands the deal. He does not chase the trail nor choose " +
      "the prey. He stands in front, and standing in front is already the hardest part of the " +
      "night.",
  },
  {
    title: "The one who finds the trail",
    text:
      "The other one nobody saw arrive, and that is exactly the point. Lean, silent, always " +
      "three steps ahead, she found the trail before the hunter knew there was one. She scented " +
      "the wind, stopped, waited for the beast to reach her, and moved on again. They say that " +
      "on a new-moon night, when not even Lumni could see the path, it was she who opened the " +
      "way in the dark and brought the whole pack back to the field. She fights for no space " +
      "and asks for nothing. She walks in front because that is where you see first, and she " +
      "always comes back, because she chose whom she wants to be near.",
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

const EN_PILLARS: readonly LorePillar[] = [
  {
    title: "Hunt",
    text:
      "Six territories that open as you climb, and prey that grows with you: the hunt never " +
      "goes stale and never comes free.",
  },
  {
    title: "Train",
    text:
      "Five attributes, one exercise for each and nothing that rises on its own. The level " +
      "opens doors, but the one who hits harder is the one who trained.",
  },
  {
    title: "Forge",
    text:
      "Go down the mine for fragments and strike the piece already on your body, from plus one " +
      "onward, as far as the bronze will carry.",
  },
  {
    title: "The pack",
    text:
      "A tavern with reserved tables, a board with the best of every number and a pit where two " +
      "werewolves settle it with their own hands.",
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

const COUPLE_TITLES: Record<Exclude<Locale, "pt">, LoreCoupleText> = {
  en: {
    male: { name: LORE_COUPLE.male.name, title: "The one who let go first" },
    female: { name: LORE_COUPLE.female.name, title: "The one who knew how to hold" },
  },
  es: {
    male: { name: LORE_COUPLE.male.name, title: "El que soltó primero" },
    female: { name: LORE_COUPLE.female.name, title: "La que supo sostener" },
  },
};

function mergeChapters(
  translated: readonly { title: string; text: string }[],
): readonly LoreChapter[] {
  return LORE_CHAPTERS.map((chapter, index) => ({
    ...chapter,
    ...(translated[index] ?? {}),
  }));
}

function mergeCompanions(
  translated: readonly { title: string; text: string }[],
): readonly LoreCompanion[] {
  return LORE_COMPANIONS.map((companion, index) => ({
    ...companion,
    ...(translated[index] ?? {}),
  }));
}

export function lorePack(locale: Locale): LorePack {
  if (locale === "en") {
    return {
      couple: COUPLE_TITLES.en,
      chapters: mergeChapters(EN_CHAPTERS),
      companions: mergeCompanions(EN_COMPANIONS),
      pillars: EN_PILLARS,
    };
  }
  if (locale === "es") {
    return {
      couple: COUPLE_TITLES.es,
      chapters: mergeChapters(ES_CHAPTERS),
      companions: mergeCompanions(ES_COMPANIONS),
      pillars: ES_PILLARS,
    };
  }
  return {
    couple: LORE_COUPLE,
    chapters: LORE_CHAPTERS,
    companions: LORE_COMPANIONS,
    pillars: LORE_PILLARS,
  };
}
