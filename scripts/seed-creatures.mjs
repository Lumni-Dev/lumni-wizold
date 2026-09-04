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
const BLOCK = AREA_LEVELS / CREATURES_PER_AREA;

function camel(slug) {
  return slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

const RARITY_PRICE = { common: 10, uncommon: 50, rare: 200, epic: 750, legendary: 2800 };
const RARITY_CHANCE = { common: 0.35, uncommon: 0.2, rare: 0.12, epic: 0.07, legendary: 0.04 };

const MATERIALS = {
  "rabbit-fur": ["Pelo de Coelho", "common"],
  "lucky-foot": ["Pata de Coelho", "uncommon"],
  "rat-tail": ["Rabo de Rato", "common"],
  "gnawed-bone": ["Osso Roído", "common"],
  "feather": ["Pena", "common"],
  "poultry-meat": ["Carne de Ave", "common"],
  "fox-pelt": ["Pele de Raposa", "uncommon"],
  "sharp-fang": ["Presa Afiada", "common"],
  "black-feather": ["Pena Negra", "common"],
  "crow-beak": ["Bico de Corvo", "common"],
  "canine-pelt": ["Pele Canina", "common"],
  "boar-tusk": ["Presa de Javali", "uncommon"],
  "thick-hide": ["Couro Grosso", "common"],
  "snake-skin": ["Pele de Cobra", "common"],
  "venom-gland": ["Glândula de Veneno", "uncommon"],
  "badger-claw": ["Garra de Texugo", "common"],
  "lynx-pelt": ["Pele de Lince", "uncommon"],
  "deer-hide": ["Couro de Veado", "common"],
  "soft-antler": ["Chifre Macio", "common"],
  "owl-feather": ["Pena de Coruja", "uncommon"],
  "talon": ["Garra", "common"],
  "wolf-pelt": ["Pele de Lobo", "uncommon"],
  "wolf-fang": ["Presa de Lobo", "uncommon"],
  "serpent-scale": ["Escama de Serpente", "uncommon"],
  "bear-pelt": ["Pele de Urso", "uncommon"],
  "bear-claw": ["Garra de Urso", "rare"],
  "wildcat-pelt": ["Pele de Gato Selvagem", "uncommon"],
  "twisted-antler": ["Chifre Torto", "uncommon"],
  "spider-silk": ["Seda de Aranha", "uncommon"],
  "goat-horn": ["Chifre de Cabra", "uncommon"],
  "eagle-feather": ["Pena de Águia", "rare"],
  "eagle-talon": ["Garra de Águia", "rare"],
  "puma-pelt": ["Pele de Puma", "rare"],
  "puma-fang": ["Presa de Puma", "rare"],
  "ram-horn": ["Chifre de Bode", "uncommon"],
  "falcon-feather": ["Pena de Falcão", "uncommon"],
  "yeti-fur": ["Pelo de Iéti", "rare"],
  "frost-heart": ["Coração Gelado", "epic"],
  "snow-pelt": ["Pele Nevada", "rare"],
  "ogre-tooth": ["Dente de Ogro", "rare"],
  "griffin-feather": ["Pena de Grifo", "rare"],
  "toad-skin": ["Pele de Sapo", "uncommon"],
  "gator-scale": ["Escama de Jacaré", "rare"],
  "gator-tooth": ["Dente de Jacaré", "rare"],
  "leech-blood": ["Sangue de Sanguessuga", "uncommon"],
  "lizard-scale": ["Escama de Lagarto", "rare"],
  "mosquito-wing": ["Asa de Mosquito", "common"],
  "swamp-mud": ["Lama do Pântano", "uncommon"],
  "naga-scale": ["Escama de Naga", "epic"],
  "hydra-scale": ["Escama de Hidra", "epic"],
  "hydra-blood": ["Sangue de Hidra", "epic"],
  "witch-hair": ["Cabelo de Bruxa", "rare"],
  "cursed-charm": ["Amuleto Amaldiçoado", "rare"],
  "steel-scrap": ["Sucata de Aço", "uncommon"],
  "coin-purse": ["Bolsa de Moedas", "rare"],
  "leather-strap": ["Correia de Couro", "uncommon"],
  "scout-map": ["Mapa do Batedor", "rare"],
  "silver-charm": ["Amuleto de Prata", "rare"],
  "silver-arrow": ["Flecha de Prata", "rare"],
  "bandit-mask": ["Máscara de Bandido", "rare"],
  "knight-plate": ["Placa de Cavaleiro", "rare"],
  "holy-water": ["Água Benta", "rare"],
  "captain-medal": ["Medalha do Capitão", "epic"],
  "master-trophy": ["Troféu do Mestre", "epic"],
  "vulture-feather": ["Pena de Abutre", "uncommon"],
  "carrion-meat": ["Carniça", "common"],
  "hyena-pelt": ["Pele de Hiena", "uncommon"],
  "scorpion-stinger": ["Ferrão de Escorpião", "rare"],
  "chitin-plate": ["Placa de Quitina", "rare"],
  "jackal-pelt": ["Pele de Chacal", "uncommon"],
  "worm-hide": ["Couro de Verme", "rare"],
  "sand-tooth": ["Dente de Areia", "rare"],
  "raider-loot": ["Espólio de Saqueador", "rare"],
  "gorgon-scale": ["Escama de Górgona", "epic"],
  "gorgon-eye": ["Olho de Górgona", "epic"],
  "golem-core": ["Núcleo de Golem", "epic"],
  "stone-shard": ["Lasca de Pedra", "uncommon"],
  "basilisk-fang": ["Presa de Basilisco", "epic"],
  "basilisk-scale": ["Escama de Basilisco", "epic"],
  "wastes-crown": ["Coroa do Ermo", "epic"],
  "bone-shard": ["Lasca de Osso", "uncommon"],
  "rusted-blade": ["Lâmina Enferrujada", "uncommon"],
  "rotten-flesh": ["Carne Podre", "uncommon"],
  "grave-dirt": ["Terra de Cova", "common"],
  "ectoplasm": ["Ectoplasma", "rare"],
  "ghoul-claw": ["Garra de Carniçal", "rare"],
  "cursed-plate": ["Placa Amaldiçoada", "rare"],
  "banshee-wail": ["Lamento de Banshee", "epic"],
  "necro-tome": ["Tomo Necromante", "epic"],
  "gargoyle-stone": ["Pedra de Gárgula", "rare"],
  "lich-phylactery": ["Filactério de Lich", "legendary"],
  "guardian-relic": ["Relíquia do Guardião", "epic"],
  "imp-horn": ["Chifre de Imp", "rare"],
  "shadow-essence": ["Essência das Sombras", "rare"],
  "hellhound-fang": ["Presa Infernal", "epic"],
  "ember-pelt": ["Pele em Brasa", "rare"],
  "demon-horn": ["Chifre de Demônio", "epic"],
  "brimstone": ["Enxofre", "rare"],
  "aberrant-eye": ["Olho Aberrante", "epic"],
  "lava-core": ["Núcleo de Lava", "epic"],
  "molten-rock": ["Rocha Fundida", "rare"],
  "succubus-wing": ["Asa de Súcubo", "epic"],
  "shadow-silk": ["Seda Sombria", "rare"],
  "behemoth-hide": ["Couro de Behemoth", "epic"],
  "behemoth-horn": ["Chifre de Behemoth", "epic"],
  "reaper-scythe": ["Foice do Ceifador", "legendary"],
  "soul-shard": ["Fragmento de Alma", "epic"],
  "abyss-crown": ["Coroa do Abismo", "legendary"],
  "dragon-scale": ["Escama de Dragão", "legendary"],
  "dragon-fang": ["Presa de Dragão", "legendary"],
  "empty-fang": ["Presa Vazia", "rare"],
  "pale-blood": ["Sangue Pálido", "rare"],
  "bat-wing": ["Asa de Morcego", "uncommon"],
  "bat-fang": ["Presa de Morcego", "uncommon"],
  "noble-signet": ["Anel de Nobre", "epic"],
  "scarlet-plate": ["Placa Escarlate", "epic"],
  "blood-grimoire": ["Grimório de Sangue", "epic"],
  "black-blood": ["Sangue Negro", "legendary"],
  "rival-pelt": ["Pele de Rival", "epic"],
  "bride-veil": ["Véu da Noiva", "epic"],
  "count-crown": ["Coroa do Conde", "legendary"],
  "queen-tiara": ["Tiara da Rainha", "legendary"],
  "silver-mane": ["Crina Prateada", "legendary"],
  "horn-dust": ["Pó de Chifre", "legendary"],
  "spectral-antler": ["Chifre Espectral", "epic"],
  "phoenix-ash": ["Cinza de Fênix", "legendary"],
  "phoenix-feather": ["Pena de Fênix", "legendary"],
  "chimera-mane": ["Juba de Quimera", "legendary"],
  "chimera-fang": ["Presa de Quimera", "legendary"],
  "pegasus-feather": ["Pena de Pégaso", "legendary"],
  "sphinx-riddle": ["Enigma da Esfinge", "legendary"],
  "golden-fur": ["Pelo Dourado", "epic"],
  "dragon-heart": ["Coração de Dragão", "legendary"],
  "seraph-feather": ["Pena de Serafim", "legendary"],
  "halo-shard": ["Fragmento de Auréola", "legendary"],
  "moon-mane": ["Crina Lunar", "legendary"],
  "moon-essence": ["Essência da Lua", "legendary"],
};

const LOOT = {
  "field-rabbit": ["rabbit-fur", "lucky-foot"],
  "barn-rat": ["rat-tail", "gnawed-bone"],
  "wild-hen": ["feather", "poultry-meat"],
  "thief-fox": ["fox-pelt", "sharp-fang"],
  "hungry-crow": ["black-feather", "crow-beak"],
  "wild-dog": ["canine-pelt", "sharp-fang"],
  "fierce-boar": ["boar-tusk", "thick-hide"],
  "wheat-snake": ["snake-skin", "venom-gland"],
  "furious-badger": ["badger-claw", "thick-hide"],
  "forest-lynx": ["lynx-pelt", "sharp-fang"],
  "young-deer": ["deer-hide", "soft-antler"],
  "brown-owl": ["owl-feather", "talon"],
  "grey-wolf": ["wolf-pelt", "wolf-fang"],
  "wood-boar": ["boar-tusk", "thick-hide"],
  "green-serpent": ["serpent-scale", "venom-gland"],
  "young-bear": ["bear-pelt", "bear-claw"],
  "wildcat": ["wildcat-pelt", "sharp-fang"],
  "twisted-antler-stag": ["twisted-antler", "deer-hide"],
  "giant-spider": ["spider-silk", "venom-gland"],
  "starving-pack": ["wolf-pelt", "wolf-fang"],
  "mountain-goat": ["goat-horn", "thick-hide"],
  "royal-eagle": ["eagle-feather", "eagle-talon"],
  "mist-bear": ["bear-pelt", "bear-claw"],
  "ridge-puma": ["puma-pelt", "puma-fang"],
  "wild-ram": ["ram-horn", "thick-hide"],
  "peregrine-falcon": ["falcon-feather", "talon"],
  "young-yeti": ["yeti-fur", "frost-heart"],
  "snow-wolf": ["snow-pelt", "wolf-fang"],
  "slope-ogre": ["ogre-tooth", "thick-hide"],
  "lesser-griffin": ["griffin-feather", "eagle-talon"],
  "poison-toad": ["toad-skin", "venom-gland"],
  "mud-gator": ["gator-scale", "gator-tooth"],
  "giant-leech": ["leech-blood", "venom-gland"],
  "swamp-serpent": ["serpent-scale", "venom-gland"],
  "armored-lizard": ["lizard-scale", "thick-hide"],
  "mosquito-swarm": ["mosquito-wing", "venom-gland"],
  "mud-man": ["swamp-mud", "thick-hide"],
  "marsh-naga": ["naga-scale", "venom-gland"],
  "young-hydra": ["hydra-scale", "hydra-blood"],
  "swamp-witch": ["witch-hair", "cursed-charm"],
  "novice-hunter": ["steel-scrap", "coin-purse"],
  "road-scout": ["leather-strap", "scout-map"],
  "mercenary": ["steel-scrap", "silver-charm"],
  "silver-archer": ["silver-arrow", "silver-charm"],
  "hunting-hound": ["canine-pelt", "sharp-fang"],
  "masked-bandit": ["bandit-mask", "coin-purse"],
  "wandering-knight": ["knight-plate", "steel-scrap"],
  "inquisitor": ["holy-water", "silver-charm"],
  "order-captain": ["captain-medal", "knight-plate"],
  "master-hunter": ["master-trophy", "silver-charm"],
  "carrion-vulture": ["vulture-feather", "carrion-meat"],
  "wastes-hyena": ["hyena-pelt", "sharp-fang"],
  "giant-scorpion": ["scorpion-stinger", "chitin-plate"],
  "starving-jackal": ["jackal-pelt", "sharp-fang"],
  "sand-worm": ["worm-hide", "sand-tooth"],
  "wild-raider": ["raider-loot", "coin-purse"],
  "lesser-gorgon": ["gorgon-scale", "gorgon-eye"],
  "stone-golem": ["golem-core", "stone-shard"],
  "basilisk": ["basilisk-fang", "basilisk-scale"],
  "wastes-lord": ["wastes-crown", "coin-purse"],
  "skeleton-warrior": ["bone-shard", "rusted-blade"],
  "crawling-zombie": ["rotten-flesh", "grave-dirt"],
  "specter": ["ectoplasm", "grave-dirt"],
  "ghoul": ["ghoul-claw", "rotten-flesh"],
  "dead-knight": ["cursed-plate", "bone-shard"],
  "banshee": ["banshee-wail", "ectoplasm"],
  "necromancer": ["necro-tome", "cursed-charm"],
  "gargoyle": ["gargoyle-stone", "stone-shard"],
  "lesser-lich": ["lich-phylactery", "necro-tome"],
  "crypt-guardian": ["guardian-relic", "bone-shard"],
  "shadow-imp": ["imp-horn", "shadow-essence"],
  "hellhound": ["hellhound-fang", "ember-pelt"],
  "lesser-demon": ["demon-horn", "brimstone"],
  "eye-aberration": ["aberrant-eye", "shadow-essence"],
  "lava-golem": ["lava-core", "molten-rock"],
  "succubus": ["succubus-wing", "shadow-silk"],
  "young-behemoth": ["behemoth-hide", "behemoth-horn"],
  "reaper": ["reaper-scythe", "soul-shard"],
  "abyss-lord": ["abyss-crown", "demon-horn"],
  "cave-dragon": ["dragon-scale", "dragon-fang"],
  "vampire-servant": ["empty-fang", "pale-blood"],
  "giant-bat": ["bat-wing", "bat-fang"],
  "night-noble": ["noble-signet", "empty-fang"],
  "scarlet-knight": ["scarlet-plate", "cursed-plate"],
  "blood-sorceress": ["blood-grimoire", "black-blood"],
  "rival-werewolf": ["rival-pelt", "wolf-fang"],
  "elder-vampire": ["black-blood", "empty-fang"],
  "bloody-bride": ["bride-veil", "pale-blood"],
  "scarlet-count": ["count-crown", "black-blood"],
  "night-queen": ["queen-tiara", "black-blood"],
  "wild-unicorn": ["silver-mane", "horn-dust"],
  "spectral-stag": ["spectral-antler", "ectoplasm"],
  "lesser-phoenix": ["phoenix-ash", "phoenix-feather"],
  "chimera": ["chimera-mane", "chimera-fang"],
  "pegasus": ["pegasus-feather", "silver-mane"],
  "sphinx": ["sphinx-riddle", "golden-fur"],
  "elder-dragon": ["dragon-scale", "dragon-heart"],
  "fallen-seraph": ["seraph-feather", "halo-shard"],
  "full-moon-unicorn": ["moon-mane", "horn-dust"],
  "moon-avatar": ["moon-essence", "silver-mane"],
};

function dropsFor(slug) {
  const ids = LOOT[slug];
  if (!ids) throw new Error("Sem loot definido para a criatura: " + slug);
  return ids.map((id) => {
    const entry = MATERIALS[id];
    if (!entry) throw new Error("Material desconhecido: " + id + " (criatura " + slug + ")");
    const rarity = entry[1];
    return {
      itemId: id,
      chance: RARITY_CHANCE[rarity],
      minimum: 1,
      maximum: rarity === "common" || rarity === "uncommon" ? 2 : 1,
    };
  });
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

export const ${camel(creature.id)}: Creature = {
  id: ${lit(creature.id)},
  name: ${lit(creature.name)},
  image: ${lit(creature.image)},
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
    const seed = level + Math.floor(BLOCK / 2);
    const numbers = speciesNumbers(archetype, seed);
    return {
      id: slug,
      name,
      image: `/assets/creatures/${area.slug}/${slug}.png`,
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
      drops: dropsFor(slug),
    };
  });

  const fileNames = [];
  for (const creature of creatureRecords) {
    const path = `${DATA}/creatures/${area.slug}/${creature.id}.ts`;
    write(path, creatureFile(creature));
    fileNames.push(creature.id);
  }

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

const usedMaterials = [...new Set(Object.values(LOOT).flat())].sort();
const materialImports = [];
const materialNames = [];
for (const id of usedMaterials) {
  const [name, rarity] = MATERIALS[id];
  const varName = camel(id);
  write(
    `${DATA}/items/materials/${id}.ts`,
    `import type { Item } from "../../../entities/item";

export const ${varName}: Item = {
  id: ${lit(id)},
  name: ${lit(name)},
  description:
    "Despojo da caça. Vale o bronze que o mercado paga por ele; não serve de arma nem de enfeite.",
  category: "material",
  rarity: ${lit(rarity)},
  price: ${RARITY_PRICE[rarity]},
  image: ${lit(`/assets/inventory/materials/${id}.png`)},
  minLevel: 1,
  stackable: true,
  inMarket: false,
  effect: {},
};
`,
  );
  materialImports.push(`import { ${varName} } from "./${id}";`);
  materialNames.push(varName);
}
write(
  `${DATA}/items/materials/index.ts`,
  `${materialImports.join("\n")}
import type { Item } from "../../../entities/item";

export const ALL_MATERIALS: readonly Item[] = [
${materialNames.map((n) => `  ${n},`).join("\n")}
];
`,
);

console.log(`seed-creatures: ${written} arquivos escritos, ${skipped} preservados.`);
