export type SpeciesKey = "rabbit" | "deer" | "bear" | "human" | "vampire" | "unicorn";

export const SPECIES_ORDER: readonly SpeciesKey[] = [
  "rabbit",
  "deer",
  "bear",
  "human",
  "vampire",
  "unicorn",
];

export const SPECIES_LABEL: Record<SpeciesKey, string> = {
  rabbit: "Coelhos",
  deer: "Veados",
  bear: "Ursos",
  human: "Humanos",
  vampire: "Vampiros",
  unicorn: "Unicórnios",
};

export interface CreatureDrop {
  itemId: string;
  chance: number;
  minimum: number;
  maximum: number;
}

export interface Creature {
  id: string;
  name: string;
  // Hand-added art path for the creature, empty until it has one. The hunt card
  // shows an empty square while this is blank, ready to receive the image.
  image?: string;
  description: string;
  species: SpeciesKey;
  level: number;
  health: number;
  strength: number;
  endurance: number;
  agility: number;
  experience: number;
  minBronze: number;
  maxBronze: number;
  drops: readonly CreatureDrop[];
}

export interface LevelBand {
  start: number;
  end: number;
}
