export interface PreviewShot {
  key: string;
  label: string;
  title: string;
  text: string;
  image: string;
}

export const PREVIEW_SHOTS: readonly PreviewShot[] = [
  {
    key: "character",
    label: "Character",
    title: "The whole sheet, no hidden number",
    text:
      "Attributes, form, wolf and combat on the same screen, with the origin of every " +
      "point split apart: training, equipment, companion, moon and fury.",
    image: "/assets/landing/character.webp?v=11",
  },
  {
    key: "hunt",
    label: "Hunt",
    title: "Six territories, narrated live",
    text:
      "The trail fills, the prey answers and the fight runs down line by line. Only the " +
      "beast hunts: in human skin the field refuses.",
    image: "/assets/landing/hunt.webp?v=11",
  },
  {
    key: "training",
    label: "Training",
    title: "Five exercises, a whole lifetime",
    text:
      "Each attribute has its own yard, the session charges WCoins and the gain follows " +
      "the level with no hidden gift in the band.",
    image: "/assets/landing/training.webp?v=11",
  },
  {
    key: "market",
    label: "Market",
    title: "A counter of pieces and potions",
    text:
      "Five sets climb band by band, potions priced in hunts of your night and one copy " +
      "of each piece: what is already in the bag or on the body the counter refuses.",
    image: "/assets/landing/market.webp?v=11",
  },
  {
    key: "forge",
    label: "Forge",
    title: "Vein, fragment and hammer",
    text:
      "The mine opens the veins by band, the anvil strikes the piece you already wear " +
      "and every +1 stays on the piece, not the slot.",
    image: "/assets/landing/forge.webp?v=11",
  },
  {
    key: "arena",
    label: "Arena",
    title: "A pit against real hunters",
    text:
      "A rival from the ranking, a WCoin prize from their purse and a replay of the " +
      "fight at the same cadence as the hunt.",
    image: "/assets/landing/arena.webp?v=11",
  },
  {
    key: "tavern",
    label: "Tavern",
    title: "Tables that do not wait for a refresh",
    text:
      "Two tables per row, a mug on every card and pagination when the hall passes eight. " +
      "Open or locked rooms, live messages, pack invites and a notice when the chair lights up.",
    image: "/assets/landing/tavern.webp?v=13",
  },
];
