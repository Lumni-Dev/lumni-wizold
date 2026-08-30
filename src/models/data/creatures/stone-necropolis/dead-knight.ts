import type { Creature } from "../types";

// Cavaleiro Morto (NV. 641 a 650) da área Necrópole de Pedra.
export const deadKnight: Creature = {
  id: "dead-knight",
  name: "Cavaleiro Morto",
  image: "/assets/creatures/stone-necropolis/dead-knight.png",
  description: "Territoriais e lentos para desistir. Uma pancada basta para quebrar costela.",
  species: "bear",
  level: 641,
  health: 48400,
  strength: 150,
  endurance: 6159,
  agility: 229,
  experience: 4534,
  minBronze: 2192,
  maxBronze: 4072,
  drops: [
    { itemId: "cursed-plate", chance: 0.12, minimum: 1, maximum: 1 },
    { itemId: "bone-shard", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
