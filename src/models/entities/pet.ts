export type PetGender = "male" | "female";

export interface Pet {
  id: string;
  name: string;
  gender: PetGender;
  energy: number;
  active?: boolean;
  level?: number;
  trainingProgress?: number;
  adoptedAt: string;
}

export interface PetDefinition {
  key: PetGender;
  label: string;
  title: string;
  description: string;
}

export const PETS: readonly PetDefinition[] = [
  {
    key: "male",
    label: "Male",
    title: "Companion of the Prey",
    description:
      "Broad chest and heavy step. He stands between you and the creature without " +
      "asking leave, and takes the first charge in place of your shoulder.",
  },
  {
    key: "female",
    label: "Female",
    title: "Companion of the Moon",
    description:
      "Lean, silent, always three steps ahead. She finds the trail before you catch " +
      "the scent and warns you when something watches back.",
  },
];

export function findPet(gender: PetGender): PetDefinition {
  return PETS.find((definition) => definition.key === gender) ?? PETS[0];
}
