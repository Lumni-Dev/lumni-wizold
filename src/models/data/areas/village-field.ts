import type { Territory } from "./types";

export const villageField: Territory = {
  id: "village-field",
  name: "Village Field",
  description: "Tall grass behind the last houses, where the smell of smoke still reaches. Children cut through here by day and swear they never saw a thing; at night, nobody wonders at a shape running between the fences. It is where almost every wolf learns to hunt, because here mistakes cost little.",
  species: "rabbit",
  minLevel: 1,
  maxLevel: 100,
  danger: "low",
  creatures: [
    "field-rabbit",
    "barn-rat",
    "wild-hen",
    "thief-fox",
    "hungry-crow",
    "wild-dog",
    "fierce-boar",
    "wheat-snake",
    "furious-badger",
    "forest-lynx",
  ],
};
