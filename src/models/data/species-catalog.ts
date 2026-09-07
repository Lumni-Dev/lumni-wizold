import type { SpeciesKey } from "../entities/creature";
import type { Rarity } from "../entities/item";
import type { DangerLevel } from "../entities/territory";

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
    label: "Rabbits",
    description:
      "Small, fast and more numerous than they look. The first blood of any werewolf.",
    profile: { health: 0.8, strength: 0.8, endurance: 0.6, agility: 1.4 },
    difficulty: 0.95,
    variants: [
      "Field Rabbit",
      "Ghoul Rabbit",
      "Grey Hare",
      "Rabid Rabbit",
      "New Moon Hare",
    ],
    materials: [
      {
        id: "soft-fur",
        name: "Soft Fur",
        description:
          "Serve de forro para bota e de nada mais. O vilarejo compra aos punhados sem " +
          "perguntar quem arrancou, nem com que dentes.",
        price: 1,
        rarity: "common",
        chance: 0.3,
      },
      {
        id: "lucky-foot",
        name: "Lucky Foot",
        description:
          "It brought no luck at all to its previous owner. Even so there are those who " +
          "pay for it and carry it in the pocket the whole hunt.",
        price: 1,
        rarity: "common",
        chance: 0.15,
      },
    ],
    gearDrops: [],
    territory: {
      id: "village-field",
      name: "Village Field",
      description:
        "Tall grass behind the last houses, where the smell of smoke still reaches. " +
        "Children cut through here by day and swear they never saw a thing; at night, " +
        "nobody wonders at a shape running between the fences. It is where almost every " +
        "wolf learns to hunt, because here mistakes cost little.",
      danger: "low",
    },
  },
  {
    key: "deer",
    label: "Deer",
    description: "They flee well and kick better. They feed a whole pack for weeks.",
    profile: { health: 1, strength: 0.95, endurance: 0.9, agility: 1.2 },
    difficulty: 1,
    variants: [
      "Young Deer",
      "Dew Deer",
      "Crooked-Antler Deer",
      "Elder Deer",
      "Spectral Deer",
    ],
    materials: [
      {
        id: "chipped-antler",
        name: "Chipped Antler",
        description:
          "Hard bone, broken at the base by the escape and not by the blow. Good to trade " +
          "for coin, better still to remember the deer almost got away.",
        price: 5,
        rarity: "common",
        chance: 0.28,
      },
      {
        id: "deer-hide",
        name: "Deer Hide",
        description:
          "Fino, resistente, e ainda cheirando a mato molhado. Curtido direito, aguenta " +
          "mais que couro de boi.",
        price: 8,
        rarity: "uncommon",
        chance: 0.15,
      },
    ],
    gearDrops: [],
    territory: {
      id: "dew-woods",
      name: "Dew Woods",
      description:
        "Low trees and ground that never dries, keeping every footprint like evidence. " +
        "The thin mist fools the eye but not the nose, and the deer knows it: it stops, " +
        "listens and vanishes before you lift your head. Whoever comes back empty-handed " +
        "from here tends to repeat the same mistake the following week.",
      danger: "moderate",
    },
  },
  {
    key: "bear",
    label: "Bears",
    description: "Territorial and slow to give up. One swat is enough to crack a rib.",
    profile: { health: 1.3, strength: 1.1, endurance: 1.1, agility: 0.7 },
    difficulty: 1.05,
    variants: [
      "Brown Bear",
      "Mist Bear",
      "Scarred Bear",
      "Cave Bear",
      "Titanic Bear",
    ],
    materials: [
      {
        id: "bear-claw",
        name: "Bear Claw",
        description:
          "Curved, thick, still attached to a piece of finger. Whoever tears it off " +
          "usually takes the owner's mark on the forearm along.",
        price: 16,
        rarity: "uncommon",
        chance: 0.25,
      },
      {
        id: "bear-fat",
        name: "Bear Fat",
        description:
          "The village alchemists pay well for it and never explain why. They say it " +
          "burns for three days without going out.",
        price: 26,
        rarity: "rare",
        chance: 0.12,
      },
    ],
    gearDrops: [],
    territory: {
      id: "mist-ridge",
      name: "Mist Ridge",
      description:
        "Wet stone, moss and a haze that does not lift even at noon. The roar arrives " +
        "first, hits the slope and returns from the other side, and you never know which " +
        "of the two is the beast. Shepherds used to climb here after lost sheep; now they " +
        "lock the gate and let the sheep go.",
      danger: "high",
    },
  },
  {
    key: "human",
    label: "Humans",
    description: "Hunters, mercenaries and fanatics. They come with silver, fire and method.",
    profile: { health: 1, strength: 1.15, endurance: 1.05, agility: 1 },
    difficulty: 1.08,
    variants: [
      "Novice Hunter",
      "Silver Hunter",
      "Road Mercenary",
      "Inquisitor",
      "Master of the Order",
    ],
    materials: [
      {
        id: "twisted-steel",
        name: "Twisted Steel",
        description:
          "What is left of the blade of a hunter who bet on steel instead of silver. It " +
          "still carries his smith's mark, and the day the bet stopped working.",
        price: 36,
        rarity: "rare",
        chance: 0.25,
      },
      {
        id: "stolen-charm",
        name: "Stolen Charm",
        description:
          "Blessed silver that was meant to keep the beast three steps away. It protected " +
          "while its owner believed in it, and now changes pockets for the fourth time.",
        price: 56,
        rarity: "rare",
        chance: 0.12,
      },
    ],
    gearDrops: [],
    territory: {
      id: "hunter-road",
      name: "Hunters' Road",
      description:
        "Torches in a line as far as the eye can see and silver chains hung from the " +
        "branches, chiming with the wind to warn whoever passes. It is not a trap for " +
        "beasts, it is a message. They come in groups, sleep in shifts, and know exactly " +
        "what they are hunting.",
      danger: "high",
    },
  },
  {
    key: "vampire",
    label: "Vampires",
    description: "They do not breathe, do not tire, and already know the taste of your blood.",
    profile: { health: 1.1, strength: 1.25, endurance: 1, agility: 1.3 },
    difficulty: 1.12,
    variants: [
      "Newborn Vampire",
      "Crypt Vampire",
      "Noble Vampire",
      "Elder Vampire",
      "Lord of the Night",
    ],
    materials: [
      {
        id: "empty-fang",
        name: "Empty Fang",
        description:
          "Hollow inside, made to drain and not to tear. It stays warm for hours after " +
          "being pulled, which nobody can explain.",
        price: 72,
        rarity: "rare",
        chance: 0.22,
      },
      {
        id: "black-blood",
        name: "Black Blood",
        description:
          "It does not clot, does not dry and never cools. Kept in closed glass, it " +
          "still stirs on its own as the moon grows.",
        price: 112,
        rarity: "epic",
        chance: 0.11,
      },
    ],
    gearDrops: [],
    territory: {
      id: "stone-necropolis",
      name: "Stone Necropolis",
      description:
        "Crypts opened on purpose, their lids leaned with the care of someone planning " +
        "to return. No turned earth, no missing body, and still the place smells of " +
        "something recent. Someone left the door like this for you, and has been waiting " +
        "since long before you were born.",
      danger: "extreme",
    },
  },
  {
    key: "unicorn",
    label: "Unicorns",
    description: "Nothing here is gentle. The horn runs you through before you hear the gallop.",
    profile: { health: 1.15, strength: 1.2, endurance: 1.1, agility: 1.1 },
    difficulty: 1.15,
    variants: [
      "Wild Unicorn",
      "White Unicorn",
      "Black-Horn Unicorn",
      "Ancestral Unicorn",
      "Full Moon Unicorn",
    ],
    materials: [
      {
        id: "silver-mane",
        name: "Silver Mane",
        description:
          "Every strand cuts like badly wound fishing line. It is worth a fortune, and " +
          "whoever sells it usually shows their hands as proof.",
        price: 140,
        rarity: "epic",
        chance: 0.22,
      },
      {
        id: "horn-dust",
        name: "Horn Dust",
        description:
          "It glows on its own in the dark of the pocket, faint as old embers. A pinch " +
          "is enough for the alchemist to close the shop and serve only you.",
        price: 208,
        rarity: "legendary",
        chance: 0.1,
      },
    ],
    gearDrops: [],
    territory: {
      id: "white-clearing",
      name: "White Clearing",
      description:
        "Tall pale grass without a single paw print, not even yours after you pass. The " +
        "light is always the same, moon or no moon, and no creature sings. Nothing lives " +
        "in this place by chance, and what lives here does not need to run from you.",
      danger: "extreme",
    },
  },
];

