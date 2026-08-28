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
    label: "Macho",
    title: "Companheiro de Presa",
    description:
      "Peito largo e passo pesado. Fica entre você e a criatura sem pedir licença, " +
      "e aguenta a primeira investida no lugar do seu ombro.",
  },
  {
    key: "female",
    label: "Fêmea",
    title: "Companheira de Presa",
    description:
      "Magra, silenciosa, sempre três passos à frente. Encontra o rastro antes de " +
      "você farejar e avisa quando alguma coisa observa de volta.",
  },
];

export function findPet(gender: PetGender): PetDefinition {
  return PETS.find((definition) => definition.key === gender) ?? PETS[0];
}
