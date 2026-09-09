export interface Automation {
  hunt: boolean;
  arena: boolean;
  train: boolean;
  mine: boolean;
  forge: boolean;
  alchemy: boolean;
  rest: boolean;
  transform: boolean;
  potion: boolean;
  petFeed: boolean;
  petRest: boolean;
}

export type AutomationKey = keyof Automation;

export const AUTOMATIONS: readonly { key: AutomationKey; label: string; effect: string }[] = [
  {
    key: "hunt",
    label: "Automatic hunt",
    effect:
      "Chains hunts on its own and returns to hunting when the body is whole again. Off, each click hunts once.",
  },
  {
    key: "arena",
    label: "Automatic arena",
    effect:
      "Challenges every rested rival in the band, drinking health potions between duels, until the day's attacks or the rivals run out. Off, each click books one duel.",
  },
  {
    key: "train",
    label: "Automatic training",
    effect:
      "Repeats the exercise on its own and returns to it when the bronze can pay. Off, each click trains one session.",
  },
  {
    key: "mine",
    label: "Automatic mining",
    effect:
      "Repeats the strike at the vein on its own and returns to it when the pick can swing again. Off, each click pays once.",
  },
  {
    key: "forge",
    label: "Automatic forging",
    effect:
      "Strikes the same piece again as soon as the fragments show up. Off, each click climbs one level and stops.",
  },
  {
    key: "alchemy",
    label: "Automatic alchemy",
    effect:
      "Brews the same potion again while the bag holds flasks and ingredients. Off, each click fills one flask and stops.",
  },
  {
    key: "rest",
    label: "Automatic rest",
    effect: "Lies down on its own when health hits the floor, and gets up when it fills.",
  },
  {
    key: "transform",
    label: "Automatic fury",
    effect:
      "Drinks a fury potion from the bag when the fury ends, on the hunt, even without the automatic hunt. On the full moon the sky already keeps Fury Mode on. Off, you drink by hand.",
  },
  {
    key: "potion",
    label: "Automatic potion",
    effect: "Drinks a health potion when health hits the floor, if the bag has one.",
  },
  {
    key: "petFeed",
    label: "Automatic food",
    effect: "Feeds the wolf when it runs out of breath, if the bag has any.",
  },
  {
    key: "petRest",
    label: "Automatic repose",
    effect:
      "Out of breath, feeds the wolf if the bag has food, otherwise sends it to rest, and calls it back when the energy fills.",
  },
];

export function noAutomation(): Automation {
  return {
    hunt: false,
    arena: false,
    train: false,
    mine: false,
    forge: false,
    alchemy: false,
    rest: false,
    transform: false,
    potion: false,
    petFeed: false,
    petRest: false,
  };
}

export function fillAutomation(data: unknown): Automation {
  const saved = (typeof data === "object" && data !== null ? data : {}) as Partial<Automation>;
  const base = noAutomation();

  for (const key of Object.keys(base) as AutomationKey[]) {
    if (typeof saved[key] === "boolean") base[key] = saved[key];
  }

  return base;
}
