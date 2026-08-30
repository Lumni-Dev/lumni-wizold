// One-time seeder: expands the compact area/creature catalog below into isolated
// per-entity files under src/models/data/{creatures,areas}. Stats are seeded from
// the current combat curve (speciesNumbers at each block's centre level, carrying
// the chosen archetype's profile), so day-one balance is preserved; afterwards
// every file is the hand-editable source of truth. Re-running SKIPS files that
// already exist, so tuned creatures are never clobbered; delete a file to reseed it.
//
//   node scripts/seed-creatures.mjs            seed missing files
//   node scripts/seed-creatures.mjs --force    overwrite every file
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import Module from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BUILD = join(ROOT, ".sim");
const FORCE = process.argv.includes("--force");

execFileSync("npx", ["tsc", "-p", join(HERE, "tsconfig.sim.json")], {
  cwd: ROOT,
  stdio: ["ignore", "ignore", "inherit"],
  shell: true,
});

const resolvePath = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) request = join(BUILD, request.slice(2));
  return resolvePath.call(this, request, ...rest);
};

const require = createRequire(import.meta.url);
const { speciesNumbers, SPECIES } = require(join(BUILD, "models/data/species.js"));

const MATERIAL_DROP_RATIO = 0.75;

// Each area: slug, name, danger, one representative species key (internal), and
// its 10 creatures as [slug, name, archetype]. The archetype is an existing
// species key whose profile/difficulty shapes the seeded stats.
const AREAS = [
  {
    slug: "village-field",
    name: "Campo do Vilarejo",
    species: "rabbit",
    danger: "low",
    description:
      "Capim alto atrás das últimas casas, onde o cheiro de fumaça ainda alcança. " +
      "As crianças cortam caminho por aqui de dia e juram que nunca viram nada; à noite, " +
      "ninguém estranha um vulto correndo entre as cercas. É onde quase todo lobo aprende " +
      "a caçar, porque aqui o erro custa pouco.",
    creatures: [
      ["field-rabbit", "Coelho do Campo", "rabbit"],
      ["barn-rat", "Rato de Celeiro", "rabbit"],
      ["wild-hen", "Galinha do Mato", "rabbit"],
      ["thief-fox", "Raposa Ladra", "deer"],
      ["hungry-crow", "Corvo Faminto", "deer"],
      ["wild-dog", "Cão Selvagem", "deer"],
      ["fierce-boar", "Javali Bravo", "bear"],
      ["wheat-snake", "Cobra do Trigo", "vampire"],
      ["furious-badger", "Texugo Furioso", "bear"],
      ["forest-lynx", "Lince do Mato", "vampire"],
    ],
  },
  {
    slug: "dew-woods",
    name: "Mata do Orvalho",
    species: "deer",
    danger: "moderate",
    description:
      "Árvores baixas e chão que nunca seca, guardando cada pegada como se fosse prova. " +
      "A neblina rala engana a vista, mas não o faro, e o veado sabe disso: ele para, " +
      "escuta e some antes de você levantar a cabeça. Quem volta de mãos vazias daqui " +
      "costuma repetir o mesmo erro na semana seguinte.",
    creatures: [
      ["young-deer", "Veado Jovem", "deer"],
      ["brown-owl", "Coruja Parda", "rabbit"],
      ["grey-wolf", "Lobo Cinzento", "deer"],
      ["wood-boar", "Javali da Mata", "bear"],
      ["green-serpent", "Serpente Verde", "vampire"],
      ["young-bear", "Urso Pardo Jovem", "bear"],
      ["wildcat", "Gato Selvagem", "vampire"],
      ["twisted-antler-stag", "Cervo de Chifre Torto", "deer"],
      ["giant-spider", "Aranha Gigante", "vampire"],
      ["starving-pack", "Alcateia Faminta", "human"],
    ],
  },
  {
    slug: "mist-ridge",
    name: "Serra das Brumas",
    species: "bear",
    danger: "high",
    description:
      "Pedra molhada, musgo e uma bruma que não levanta nem ao meio-dia. O rugido chega " +
      "primeiro, bate na encosta e volta de outro lado, e você nunca sabe qual dos dois é " +
      "o bicho. Os pastores subiam até aqui atrás de ovelha perdida; hoje trancam o portão " +
      "e deixam a ovelha.",
    creatures: [
      ["mountain-goat", "Cabra Montesa", "deer"],
      ["royal-eagle", "Águia Real", "vampire"],
      ["mist-bear", "Urso das Brumas", "bear"],
      ["ridge-puma", "Puma da Serra", "vampire"],
      ["wild-ram", "Bode Selvagem", "bear"],
      ["peregrine-falcon", "Falcão Peregrino", "rabbit"],
      ["young-yeti", "Iéti Jovem", "bear"],
      ["snow-wolf", "Lobo da Neve", "deer"],
      ["slope-ogre", "Ogro da Encosta", "bear"],
      ["lesser-griffin", "Grifo Menor", "unicorn"],
    ],
  },
  {
    slug: "pale-swamp",
    name: "Pântano Pálido",
    species: "bear",
    danger: "high",
    description:
      "Água parada cor de chumbo e um cheiro doce de coisa afogada. O chão engole a bota " +
      "e devolve bolha, e o que mora aqui aprendeu a esperar embaixo da lama até a presa " +
      "passar. Cada passo é uma aposta, e a saída nunca fica onde você deixou.",
    creatures: [
      ["poison-toad", "Sapo Venenoso", "rabbit"],
      ["mud-gator", "Jacaré do Lodo", "bear"],
      ["giant-leech", "Sanguessuga Gigante", "vampire"],
      ["swamp-serpent", "Serpente do Pântano", "vampire"],
      ["armored-lizard", "Lagarto Blindado", "bear"],
      ["mosquito-swarm", "Enxame de Mosquitos", "rabbit"],
      ["mud-man", "Homem-Lodo", "bear"],
      ["marsh-naga", "Naga do Charco", "vampire"],
      ["young-hydra", "Hidra Jovem", "bear"],
      ["swamp-witch", "Bruxa do Pântano", "human"],
    ],
  },
  {
    slug: "hunter-road",
    name: "Estrada dos Caçadores",
    species: "human",
    danger: "high",
    description:
      "Tochas em fila até onde a vista alcança e correntes de prata penduradas nos galhos, " +
      "tilintando com o vento para avisar quem passa. Não é armadilha para bicho, é recado. " +
      "Eles vêm em grupo, dormem em turnos e sabem exatamente o que estão caçando.",
    creatures: [
      ["novice-hunter", "Caçador Novato", "human"],
      ["road-scout", "Batedor da Estrada", "deer"],
      ["mercenary", "Mercenário", "human"],
      ["silver-archer", "Arqueiro de Prata", "vampire"],
      ["hunting-hound", "Cão de Caça", "deer"],
      ["masked-bandit", "Bandido Mascarado", "human"],
      ["wandering-knight", "Cavaleiro Errante", "bear"],
      ["inquisitor", "Inquisidor", "human"],
      ["order-captain", "Capitão da Ordem", "human"],
      ["master-hunter", "Mestre Caçador", "vampire"],
    ],
  },
  {
    slug: "grey-wastes",
    name: "Ermo Cinza",
    species: "human",
    danger: "extreme",
    description:
      "Terra rachada até o horizonte, sem sombra e sem água, só osso branco marcando quem " +
      "tentou atravessar. O vento carrega areia e voz, e nem sempre a voz é de gente viva. " +
      "Aqui se caça o que caça você, porque parar é virar marco de estrada.",
    creatures: [
      ["carrion-vulture", "Abutre Carniceiro", "rabbit"],
      ["wastes-hyena", "Hiena do Ermo", "deer"],
      ["giant-scorpion", "Escorpião Gigante", "vampire"],
      ["starving-jackal", "Chacal Faminto", "deer"],
      ["sand-worm", "Verme das Areias", "bear"],
      ["wild-raider", "Saqueador Selvagem", "human"],
      ["lesser-gorgon", "Górgona Menor", "vampire"],
      ["stone-golem", "Golem de Pedra", "bear"],
      ["basilisk", "Basilisco", "vampire"],
      ["wastes-lord", "Senhor do Ermo", "human"],
    ],
  },
  {
    slug: "stone-necropolis",
    name: "Necrópole de Pedra",
    species: "vampire",
    danger: "extreme",
    description:
      "Criptas abertas de propósito, as tampas encostadas com o cuidado de quem pretende " +
      "voltar. Não há terra revirada nem corpo faltando, e ainda assim o lugar cheira a " +
      "coisa recente. Alguém deixou a porta assim para você, e está esperando desde muito " +
      "antes de você nascer.",
    creatures: [
      ["skeleton-warrior", "Esqueleto Guerreiro", "human"],
      ["crawling-zombie", "Zumbi Rastejante", "bear"],
      ["specter", "Espectro", "vampire"],
      ["ghoul", "Carniçal", "vampire"],
      ["dead-knight", "Cavaleiro Morto", "bear"],
      ["banshee", "Banshee", "vampire"],
      ["necromancer", "Necromante", "human"],
      ["gargoyle", "Gárgula", "bear"],
      ["lesser-lich", "Lich Menor", "unicorn"],
      ["crypt-guardian", "Guardião da Cripta", "bear"],
    ],
  },
  {
    slug: "howling-abyss",
    name: "Abismo Uivante",
    species: "vampire",
    danger: "extreme",
    description:
      "A pedra desce mais do que a tocha alcança, e o uivo sobe de um lugar que não tem " +
      "fundo. O ar queima e o chão pulsa, quente como bicho adormecido. Ninguém desce por " +
      "engano, e quase ninguém sobe de novo.",
    creatures: [
      ["shadow-imp", "Imp das Sombras", "rabbit"],
      ["hellhound", "Cão do Inferno", "vampire"],
      ["lesser-demon", "Demônio Menor", "human"],
      ["eye-aberration", "Aberração Ocular", "vampire"],
      ["lava-golem", "Golem de Lava", "bear"],
      ["succubus", "Súcubo", "vampire"],
      ["young-behemoth", "Behemoth Jovem", "bear"],
      ["reaper", "Ceifador", "vampire"],
      ["abyss-lord", "Senhor do Abismo", "unicorn"],
      ["cave-dragon", "Dragão das Cavernas", "bear"],
    ],
  },
  {
    slug: "scarlet-castle",
    name: "Castelo Escarlate",
    species: "vampire",
    danger: "extreme",
    description:
      "Portões abertos de par em par, velas acesas em corredor que ninguém varre há um " +
      "século. A mesa está posta, o vinho é vermelho demais, e o dono desce a escada sem " +
      "pressa, porque a noite é dele e você chegou cedo. Aqui a fera é a convidada, não a " +
      "anfitriã.",
    creatures: [
      ["vampire-servant", "Servo Vampiro", "vampire"],
      ["giant-bat", "Morcego Gigante", "rabbit"],
      ["night-noble", "Nobre da Noite", "vampire"],
      ["scarlet-knight", "Cavaleiro Escarlate", "bear"],
      ["blood-sorceress", "Feiticeira de Sangue", "human"],
      ["rival-werewolf", "Lobisomem Rival", "vampire"],
      ["elder-vampire", "Vampiro Ancião", "vampire"],
      ["bloody-bride", "Noiva Sangrenta", "vampire"],
      ["scarlet-count", "Conde Escarlate", "unicorn"],
      ["night-queen", "Rainha da Noite", "unicorn"],
    ],
  },
  {
    slug: "white-clearing",
    name: "Clareira Branca",
    species: "unicorn",
    danger: "extreme",
    description:
      "Grama alta e clara, sem uma única marca de pata, nem a sua depois que você passa. " +
      "A luz é sempre a mesma, com lua ou sem lua, e nenhum bicho canta. Nada vive neste " +
      "lugar por acaso, e o que vive aqui não precisa correr de você.",
    creatures: [
      ["wild-unicorn", "Unicórnio Selvagem", "unicorn"],
      ["spectral-stag", "Cervo Espectral", "deer"],
      ["lesser-phoenix", "Fênix Menor", "vampire"],
      ["chimera", "Quimera", "bear"],
      ["pegasus", "Pégaso", "unicorn"],
      ["sphinx", "Esfinge", "human"],
      ["elder-dragon", "Dragão Ancião", "bear"],
      ["fallen-seraph", "Serafim Caído", "unicorn"],
      ["full-moon-unicorn", "Unicórnio da Lua Cheia", "unicorn"],
      ["moon-avatar", "Avatar da Lua", "unicorn"],
    ],
  },
];

const AREA_LEVELS = 100;
const CREATURES_PER_AREA = 10;
const BLOCK = AREA_LEVELS / CREATURES_PER_AREA; // 10 levels each

function camel(slug) {
  return slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function dropsFor(archetype) {
  const def = SPECIES.find((entry) => entry.key === archetype) ?? SPECIES[0];
  return def.materials.map((material) => ({
    itemId: material.id,
    chance: Math.round(material.chance * MATERIAL_DROP_RATIO * 1000) / 1000,
    minimum: 1,
    maximum: 2,
  }));
}

function descriptionFor(archetype) {
  const def = SPECIES.find((entry) => entry.key === archetype) ?? SPECIES[0];
  return def.description;
}

function lit(value) {
  return JSON.stringify(value);
}

function creatureFile(creature) {
  const dropLines = creature.drops
    .map(
      (drop) =>
        `    { itemId: ${lit(drop.itemId)}, chance: ${drop.chance}, minimum: ${drop.minimum}, maximum: ${drop.maximum} },`,
    )
    .join("\n");
  return `import type { Creature } from "../types";

// ${creature.name} (NV. ${creature.level} a ${creature.level + BLOCK - 1}) da área ${creature.areaName}.
export const ${camel(creature.id)}: Creature = {
  id: ${lit(creature.id)},
  name: ${lit(creature.name)},
  description: ${lit(creature.description)},
  species: ${lit(creature.species)},
  level: ${creature.level},
  health: ${creature.health},
  strength: ${creature.strength},
  endurance: ${creature.endurance},
  agility: ${creature.agility},
  experience: ${creature.experience},
  minBronze: ${creature.minBronze},
  maxBronze: ${creature.maxBronze},
  drops: [
${dropLines}
  ],
};
`;
}

let written = 0;
let skipped = 0;

function write(path, contents) {
  const full = join(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  if (!FORCE && existsSync(full)) {
    skipped++;
    return;
  }
  writeFileSync(full, contents, "utf8");
  written++;
}

const DATA = "src/models/data";

// creatures/types.ts + areas/types.ts
write(
  `${DATA}/creatures/types.ts`,
  `export type { Creature, CreatureDrop } from "@/models/entities/creature";\n`,
);
write(
  `${DATA}/areas/types.ts`,
  `export type { Territory, DangerLevel } from "@/models/entities/territory";\n`,
);

const areaIndexImports = [];
const areaIndexNames = [];

for (let a = 0; a < AREAS.length; a++) {
  const area = AREAS[a];
  const creatureRecords = area.creatures.map(([slug, name, archetype], c) => {
    const level = a * AREA_LEVELS + c * BLOCK + 1;
    const seed = level + Math.floor(BLOCK / 2); // block centre
    const numbers = speciesNumbers(archetype, seed);
    return {
      id: slug,
      name,
      species: archetype,
      areaName: area.name,
      description: descriptionFor(archetype),
      level,
      health: numbers.health,
      strength: numbers.strength,
      endurance: numbers.endurance,
      agility: numbers.agility,
      experience: numbers.experience,
      minBronze: numbers.minBronze,
      maxBronze: numbers.maxBronze,
      drops: dropsFor(archetype),
    };
  });

  // one file per creature
  const fileNames = [];
  for (const creature of creatureRecords) {
    const path = `${DATA}/creatures/${area.slug}/${creature.id}.ts`;
    write(path, creatureFile(creature));
    fileNames.push(creature.id);
  }

  // area's creature index
  const imports = creatureRecords
    .map((c) => `import { ${camel(c.id)} } from "./${c.id}";`)
    .join("\n");
  const list = creatureRecords.map((c) => `  ${camel(c.id)},`).join("\n");
  write(
    `${DATA}/creatures/${area.slug}/index.ts`,
    `${imports}\nimport type { Creature } from "../types";\n\nexport const ${camel(area.slug)}Creatures: readonly Creature[] = [\n${list}\n];\n`,
  );

  areaIndexImports.push(
    `import { ${camel(area.slug)}Creatures } from "./${area.slug}";`,
  );
  areaIndexNames.push(`${camel(area.slug)}Creatures`);

  // area (territory) file
  const minLevel = a * AREA_LEVELS + 1;
  const maxLevel = (a + 1) * AREA_LEVELS;
  const ids = fileNames.map((id) => `    ${lit(id)},`).join("\n");
  write(
    `${DATA}/areas/${area.slug}.ts`,
    `import type { Territory } from "./types";

export const ${camel(area.slug)}: Territory = {
  id: ${lit(area.slug)},
  name: ${lit(area.name)},
  description: ${lit(area.description)},
  species: ${lit(area.species)},
  minLevel: ${minLevel},
  maxLevel: ${maxLevel},
  danger: ${lit(area.danger)},
  creatures: [
${ids}
  ],
};
`,
  );
}

// creatures/index.ts
write(
  `${DATA}/creatures/index.ts`,
  `${areaIndexImports.join("\n")}
import type { Creature } from "./types";

export type { Creature, CreatureDrop } from "./types";

export const ALL_CREATURES: readonly Creature[] = [
${areaIndexNames.map((n) => `  ...${n},`).join("\n")}
];

const CREATURE_INDEX = new Map<string, Creature>(
  ALL_CREATURES.map((creature) => [creature.id, creature]),
);

export function findCreature(creatureId: string): Creature | undefined {
  return CREATURE_INDEX.get(creatureId);
}
`,
);

// areas/index.ts
const areaImports = AREAS.map((area) => `import { ${camel(area.slug)} } from "./${area.slug}";`).join("\n");
const areaList = AREAS.map((area) => `  ${camel(area.slug)},`).join("\n");
write(
  `${DATA}/areas/index.ts`,
  `${areaImports}
import type { Territory } from "./types";

export type { Territory, DangerLevel } from "./types";

export const ALL_AREAS: readonly Territory[] = [
${areaList}
];

const AREA_INDEX = new Map<string, Territory>(ALL_AREAS.map((area) => [area.id, area]));

export function findArea(areaId: string): Territory | undefined {
  return AREA_INDEX.get(areaId);
}
`,
);

console.log(`seed-creatures: ${written} arquivos escritos, ${skipped} preservados.`);
