import type { Creature } from "../types";

// Lobo Cinzento (NV. 121 a 130) da área Mata do Orvalho.
export const greyWolf: Creature = {
  id: "grey-wolf",
  name: "Lobo Cinzento",
  image: "/assets/creatures/dew-woods/grey-wolf.png",
  description: "Fogem bem e chutam melhor. Alimentam uma matilha inteira por semanas.",
  species: "deer",
  level: 121,
  health: 743,
  strength: 21,
  endurance: 127,
  agility: 80,
  experience: 894,
  minBronze: 59,
  maxBronze: 111,
  drops: [
    { itemId: "wolf-pelt", chance: 0.2, minimum: 1, maximum: 2 },
    { itemId: "wolf-fang", chance: 0.2, minimum: 1, maximum: 2 },
  ],
};
