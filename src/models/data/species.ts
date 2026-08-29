import {
  BASE_ATTRIBUTE_VALUE,
  BASE_VITAL,
  HEALTH_PER_ENDURANCE,
  MAX_ATTRIBUTE_VALUE,
  MAX_CHARACTER_LEVEL,
} from "@/shared/constants/game";
import {
  SPECIES_ORDER,
  type Creature,
  type CreatureDrop,
  type LevelBand,
  type SpeciesKey,
} from "../entities/creature";
import type { Item, Rarity } from "../entities/item";
import type { DangerLevel, Territory } from "../entities/territory";
import { EQUIPMENT_SETS, setAttributes } from "./equipment-sets";

const VARIANTS_PER_SPECIES = 5;

interface SpeciesProfile {
  health: number;
  strength: number;
  endurance: number;
  agility: number;
}

interface SpeciesMaterial {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: Rarity;
  chance: number;
}

interface SpeciesDefinition {
  key: SpeciesKey;
  label: string;
  description: string;
  profile: SpeciesProfile;

  difficulty: number;

  variants: readonly string[];
  materials: readonly SpeciesMaterial[];

  gearDrops: readonly { itemId: string; chance: number }[];
  territory: {
    id: string;
    name: string;
    description: string;
    danger: DangerLevel;
  };
}

export const SPECIES: readonly SpeciesDefinition[] = [
  {
    key: "rabbit",
    label: "Coelhos",
    description:
      "Pequenos, rápidos e em número maior do que parece. O primeiro sangue de qualquer lobisomem.",
    profile: { health: 0.8, strength: 0.8, endurance: 0.6, agility: 1.4 },
    difficulty: 0.95,
    variants: [
      "Coelho do Campo",
      "Coelho Carniçal",
      "Lebre Cinzenta",
      "Coelho Raivoso",
      "Lebre da Lua Nova",
    ],
    materials: [
      {
        id: "soft-fur",
        name: "Pelo Macio",
        description:
          "Serve de forro para bota e de nada mais. O vilarejo compra aos punhados sem " +
          "perguntar quem arrancou, nem com que dentes.",
        price: 20,
        rarity: "common",
        chance: 0.3,
      },
      {
        id: "lucky-foot",
        name: "Pata de Sorte",
        description:
          "Não deu sorte nenhuma para o dono anterior. Ainda assim há quem pague por " +
          "ela e a carregue no bolso a caçada inteira.",
        price: 35,
        rarity: "common",
        chance: 0.15,
      },
    ],
    gearDrops: [],
    territory: {
      id: "village-field",
      name: "Campo do Vilarejo",
      description:
        "Capim alto atrás das últimas casas, onde o cheiro de fumaça ainda alcança. " +
        "As crianças cortam caminho por aqui de dia e juram que nunca viram nada; à noite, " +
        "ninguém estranha um vulto correndo entre as cercas. É onde quase todo lobo aprende " +
        "a caçar, porque aqui o erro custa pouco.",
      danger: "low",
    },
  },
  {
    key: "deer",
    label: "Veados",
    description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
    profile: { health: 1, strength: 0.95, endurance: 0.9, agility: 1.2 },
    difficulty: 1,
    variants: [
      "Veado Jovem",
      "Veado do Orvalho",
      "Veado de Chifre Torto",
      "Veado Ancião",
      "Veado Espectral",
    ],
    materials: [
      {
        id: "chipped-antler",
        name: "Chifre Lascado",
        description:
          "Osso duro, quebrado na base pela fuga e não pelo golpe. Bom para trocar por " +
          "moeda, melhor ainda para lembrar que o veado quase escapou.",
        price: 120,
        rarity: "common",
        chance: 0.28,
      },
      {
        id: "deer-hide",
        name: "Couro de Veado",
        description:
          "Fino, resistente, e ainda cheirando a mato molhado. Curtido direito, aguenta " +
          "mais que couro de boi.",
        price: 200,
        rarity: "uncommon",
        chance: 0.15,
      },
    ],
    gearDrops: [],
    territory: {
      id: "dew-woods",
      name: "Mata do Orvalho",
      description:
        "Árvores baixas e chão que nunca seca, guardando cada pegada como se fosse prova. " +
        "A neblina rala engana a vista, mas não o faro, e o veado sabe disso: ele para, " +
        "escuta e some antes de você levantar a cabeça. Quem volta de mãos vazias daqui " +
        "costuma repetir o mesmo erro na semana seguinte.",
      danger: "moderate",
    },
  },
  {
    key: "bear",
    label: "Ursos",
    description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
    profile: { health: 1.3, strength: 1.1, endurance: 1.1, agility: 0.7 },
    difficulty: 1.05,
    variants: [
      "Urso Pardo",
      "Urso das Brumas",
      "Urso Cicatrizado",
      "Urso da Caverna",
      "Urso Titânico",
    ],
    materials: [
      {
        id: "bear-claw",
        name: "Garra de Urso",
        description:
          "Curva, grossa, ainda presa a um pedaço de dedo. Quem a arranca costuma levar " +
          "junto a marca do dono no antebraço.",
        price: 400,
        rarity: "uncommon",
        chance: 0.25,
      },
      {
        id: "bear-fat",
        name: "Gordura de Urso",
        description:
          "Os alquimistas do vilarejo pagam bem por ela e não explicam para quê. Dizem " +
          "que arde por três dias sem apagar.",
        price: 650,
        rarity: "rare",
        chance: 0.12,
      },
    ],
    gearDrops: [],
    territory: {
      id: "mist-ridge",
      name: "Serra das Brumas",
      description:
        "Pedra molhada, musgo e uma bruma que não levanta nem ao meio-dia. O rugido chega " +
        "primeiro, bate na encosta e volta de outro lado, e você nunca sabe qual dos dois é " +
        "o bicho. Os pastores subiam até aqui atrás de ovelha perdida; hoje trancam o portão " +
        "e deixam a ovelha.",
      danger: "high",
    },
  },
  {
    key: "human",
    label: "Humanos",
    description: "Caçadores, mercenários e fanáticos. Vêm com prata, fogo e método.",
    profile: { health: 1, strength: 1.15, endurance: 1.05, agility: 1 },
    difficulty: 1.08,
    variants: [
      "Caçador Novato",
      "Caçador de Prata",
      "Mercenário da Estrada",
      "Inquisidor",
      "Mestre da Ordem",
    ],
    materials: [
      {
        id: "twisted-steel",
        name: "Aço Retorcido",
        description:
          "Sobra da lâmina de um caçador que apostou no aço em vez da prata. Ainda tem a " +
          "marca do ferreiro dele, e o dia em que a aposta parou de servir.",
        price: 900,
        rarity: "rare",
        chance: 0.25,
      },
      {
        id: "stolen-charm",
        name: "Amuleto Roubado",
        description:
          "Prata benta que devia manter a fera a três passos de distância. Protegeu " +
          "enquanto o dono acreditou nela, e agora troca de bolso pela quarta vez.",
        price: 1400,
        rarity: "rare",
        chance: 0.12,
      },
    ],
    gearDrops: [],
    territory: {
      id: "hunter-road",
      name: "Estrada dos Caçadores",
      description:
        "Tochas em fila até onde a vista alcança e correntes de prata penduradas nos galhos, " +
        "tilintando com o vento para avisar quem passa. Não é armadilha para bicho, é recado. " +
        "Eles vêm em grupo, dormem em turnos e sabem exatamente o que estão caçando.",
      danger: "high",
    },
  },
  {
    key: "vampire",
    label: "Vampiros",
    description: "Não respiram, não cansam e já conhecem o gosto do seu sangue.",
    profile: { health: 1.1, strength: 1.25, endurance: 1, agility: 1.3 },
    difficulty: 1.12,
    variants: [
      "Vampiro Recém-Nascido",
      "Vampiro de Cripta",
      "Vampiro Nobre",
      "Vampiro Ancião",
      "Senhor da Noite",
    ],
    materials: [
      {
        id: "empty-fang",
        name: "Presa Vazia",
        description:
          "Oca por dentro, feita para sugar e não para rasgar. Continua quente horas " +
          "depois de arrancada, o que ninguém consegue explicar.",
        price: 1800,
        rarity: "rare",
        chance: 0.22,
      },
      {
        id: "black-blood",
        name: "Sangue Negro",
        description:
          "Não coagula, não seca e nunca esfria. Guardada em vidro fechado, ainda se " +
          "mexe sozinha quando a lua cresce.",
        price: 2800,
        rarity: "epic",
        chance: 0.11,
      },
    ],
    gearDrops: [],
    territory: {
      id: "stone-necropolis",
      name: "Necrópole de Pedra",
      description:
        "Criptas abertas de propósito, as tampas encostadas com o cuidado de quem pretende " +
        "voltar. Não há terra revirada nem corpo faltando, e ainda assim o lugar cheira a " +
        "coisa recente. Alguém deixou a porta assim para você, e está esperando desde muito " +
        "antes de você nascer.",
      danger: "extreme",
    },
  },
  {
    key: "unicorn",
    label: "Unicórnios",
    description: "Nada aqui é gentil. O chifre atravessa antes de você ouvir o galope.",
    profile: { health: 1.15, strength: 1.2, endurance: 1.1, agility: 1.1 },
    difficulty: 1.15,
    variants: [
      "Unicórnio Selvagem",
      "Unicórnio Branco",
      "Unicórnio de Chifre Negro",
      "Unicórnio Ancestral",
      "Unicórnio da Lua Cheia",
    ],
    materials: [
      {
        id: "silver-mane",
        name: "Crina Prateada",
        description:
          "Cada fio corta como linha de pescar mal enrolada. Vale uma fortuna, e quem " +
          "vende costuma mostrar as mãos como prova.",
        price: 3500,
        rarity: "epic",
        chance: 0.22,
      },
      {
        id: "horn-dust",
        name: "Pó de Chifre",
        description:
          "Brilha sozinho no escuro do bolso, fraco como brasa velha. Uma pitada basta " +
          "para o alquimista fechar a loja e atender só você.",
        price: 5200,
        rarity: "legendary",
        chance: 0.1,
      },
    ],
    gearDrops: [],
    territory: {
      id: "white-clearing",
      name: "Clareira Branca",
      description:
        "Grama alta e clara, sem uma única marca de pata, nem a sua depois que você passa. " +
        "A luz é sempre a mesma, com lua ou sem lua, e nenhum bicho canta. Nada vive neste " +
        "lugar por acaso, e o que vive aqui não precisa correr de você.",
      danger: "extreme",
    },
  },
];

const LEVEL_STEP = 5;

function roundToStep(value: number): number {
  return Math.max(LEVEL_STEP, Math.round(value / LEVEL_STEP) * LEVEL_STEP);
}

function speciesBand(index: number): LevelBand {
  const size = MAX_CHARACTER_LEVEL / SPECIES_ORDER.length;
  const last = SPECIES_ORDER.length - 1;

  return {
    start: index === 0 ? 1 : roundToStep(index * size) + LEVEL_STEP,
    end: index === last ? MAX_CHARACTER_LEVEL : roundToStep((index + 1) * size),
  };
}

export function bandOf(key: SpeciesKey): LevelBand {
  return speciesBand(SPECIES_ORDER.indexOf(key));
}

function variantLevels(band: LevelBand): number[] {
  const steps = VARIANTS_PER_SPECIES - 1;

  return Array.from({ length: VARIANTS_PER_SPECIES }, (_, index) => {
    if (index === 0) return band.start;
    if (index === steps) return band.end;
    return roundToStep(band.start + ((band.end - band.start) * index) / steps);
  });
}

function creatureDrops(definition: SpeciesDefinition): CreatureDrop[] {
  const materials = definition.materials.map((material) => ({
    itemId: material.id,
    chance: material.chance,
    minimum: 1,
    maximum: 2,
  }));

  const gear = definition.gearDrops.map((drop) => ({
    itemId: drop.itemId,
    chance: drop.chance,
    minimum: 1,
    maximum: 1,
  }));

  return [...materials, ...gear];
}

const PREY_STRENGTH_SHARE = 0.85;
const PREY_ENDURANCE_SHARE = 0.5;
const PREY_HEALTH_SHARE = 0.3;

const BRONZE_PER_STRENGTH = 0.9;

const TRAINED_PER_LEVEL = 0.55;

const SET_REACHED_AT = 0.08;

function referenceGear(level: number) {
  const owned = EQUIPMENT_SETS.filter((definition) => definition.minLevel <= level);
  const current = owned[owned.length - 1] ?? EQUIPMENT_SETS[0];
  const previous = owned[owned.length - 2] ?? null;
  const next = EQUIPMENT_SETS[owned.length];

  const start = current.minLevel;
  const end = (next?.minLevel ?? MAX_CHARACTER_LEVEL + 1) - 1;
  const ramp = Math.max(1, (end - start) * SET_REACHED_AT);
  const at = Math.min(1, Math.max(0, (level - start) / ramp));

  const now = setAttributes(current);
  const before = previous
    ? setAttributes(previous)
    : { strength: 0, agility: 0, endurance: 0, instinct: 0, willpower: 0 };

  return {
    strength: before.strength + (now.strength - before.strength) * at,
    endurance: before.endurance + (now.endurance - before.endurance) * at,
  };
}

function referenceHunter(level: number) {
  const trained = Math.min(
    MAX_ATTRIBUTE_VALUE,
    Math.max(BASE_ATTRIBUTE_VALUE, Math.round(level * TRAINED_PER_LEVEL)),
  );
  const gear = referenceGear(level);
  const endurance = trained + gear.endurance;

  return {
    strength: trained + gear.strength,
    endurance,
    health: BASE_VITAL + (endurance - BASE_ATTRIBUTE_VALUE) * HEALTH_PER_ENDURANCE,
  };
}

const BAND_RAMP_LOW = 0.92;
const BAND_RAMP_HIGH = 1.12;

function bandPressure(key: SpeciesKey, level: number): number {
  const band = bandOf(key);
  const at = Math.min(1, Math.max(0, (level - band.start) / Math.max(1, band.end - band.start)));
  return BAND_RAMP_LOW + (BAND_RAMP_HIGH - BAND_RAMP_LOW) * at;
}

export function huntPurse(level: number): number {
  return Math.round(referenceHunter(level).strength * BRONZE_PER_STRENGTH);
}

export function speciesNumbers(key: SpeciesKey, level: number) {
  const definition = SPECIES.find((entry) => entry.key === key) ?? SPECIES[0];
  const difficulty = definition.difficulty * bandPressure(key, level);
  const hunter = referenceHunter(level);
  const purse = hunter.strength * BRONZE_PER_STRENGTH;

  return {
    health: Math.round(hunter.health * PREY_HEALTH_SHARE * definition.profile.health * difficulty),
    strength: Math.round(
      hunter.strength * PREY_STRENGTH_SHARE * definition.profile.strength * difficulty,
    ),
    endurance: Math.round(
      hunter.endurance * PREY_ENDURANCE_SHARE * definition.profile.endurance * difficulty,
    ),
    agility: Math.round((4 + level * 0.5) * definition.profile.agility),
    experience: Math.round(12 + level * 7),
    minBronze: Math.round(purse * 0.7),
    maxBronze: Math.round(purse * 1.3),
  };
}

export function buildCreatures(): Creature[] {
  return SPECIES.flatMap((definition) => {
    const band = bandOf(definition.key);
    const drops = creatureDrops(definition);

    return variantLevels(band).map((level, index) => ({
      id: definition.key + "-" + (index + 1),
      name: definition.variants[index],
      description: definition.description,
      species: definition.key,
      level,
      ...speciesNumbers(definition.key, level),
      drops,
    }));
  });
}

export function buildTerritories(): Territory[] {
  const creatures = buildCreatures();

  return SPECIES.map((definition) => {
    const band = bandOf(definition.key);

    return {
      id: definition.territory.id,
      name: definition.territory.name,
      description: definition.territory.description,
      species: definition.key,
      minLevel: band.start,
      maxLevel: band.end,
      danger: definition.territory.danger,
      creatures: creatures
        .filter((creature) => creature.species === definition.key)
        .map((creature) => creature.id),
    };
  });
}

export function buildMaterials(): Item[] {
  return SPECIES.flatMap((definition) =>
    definition.materials.map((material) => ({
      id: material.id,
      name: material.name,
      description: material.description,
      category: "material" as const,
      rarity: material.rarity,
      price: material.price,
      minLevel: 1,
      stackable: true,
      inMarket: false,
      effect: {},
    })),
  );
}
