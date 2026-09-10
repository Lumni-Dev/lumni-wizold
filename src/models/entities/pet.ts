export interface Pet {
  id: string;
  name: string;
  energy: number;
  active?: boolean;
  level?: number;
  trainingProgress?: number;
  adoptedAt: string;
}

export const PET_TITLE = "Companion of the Prey";

export const PET_DESCRIPTION =
  "It stands between you and the creature without asking leave, takes the first charge in " +
  "place of your shoulder, and finds the trail before you catch the scent.";
