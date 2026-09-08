export interface NavigationItem {
  href: string;
  label: string;
  code: string;
  description: string;
}

export const NAVIGATION: readonly NavigationItem[] = [
  { href: "/character", label: "Character", code: "PS", description: "Sheet, attributes and form" },
  {
    href: "/inventory",
    label: "Inventory",
    code: "IV",
    description: "Items, equipment and consumables",
  },
  { href: "/training", label: "Training", code: "TR", description: "Attribute progression" },
  { href: "/hunt", label: "Hunt", code: "CA", description: "Territories and combat" },
  { href: "/arena", label: "Arena", code: "AR", description: "Duels against other werewolves" },

  { href: "/pet", label: "Companion", code: "MS", description: "Your wolf and its supplies" },
  { href: "/market", label: "Market", code: "MC", description: "Buy and sell items" },
  {
    href: "/forge",
    label: "Forge",
    code: "FJ",
    description: "Mining and gear enhancement",
  },
  {
    href: "/alchemy",
    label: "Alchemy",
    code: "AQ",
    description: "Potions brewed from the hunt's spoils",
  },
  {
    href: "/bazaar",
    label: "Bazaar",
    code: "BZ",
    description: "Forged gear traded between players",
  },
  {
    href: "/tavern",
    label: "Tavern",
    code: "TV",
    description: "Chat tables between players",
  },
  { href: "/ranking", label: "Ranking", code: "RK", description: "The best of every number" },
  { href: "/wiki", label: "Wiki", code: "WK", description: "Rules, bestiary and catalog" },
] as const;

export const STORE_LINK: NavigationItem = {
  href: "/store",
  label: "Wizold Store",
  code: "LS",
  description: "WCoin packs for real money",
};

export const SETTINGS_LINK: NavigationItem = {
  href: "/settings",
  label: "Settings",
  code: "CF",
  description: "Account, name and run",
};

export const TUTORIAL_LINK = {
  label: "How to play",
  code: "TJ",
  description: "The first night, again",
};
