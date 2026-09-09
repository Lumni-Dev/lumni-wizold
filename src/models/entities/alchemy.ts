// The cauldron keeps a ladder of its own, like the mine: what a scroll asks
// is alchemy skill, never the hunter's level, so a patient brewer opens the
// deeper rituals without hunting a single band further.
export interface AlchemyState {
  level: number;
  progress: number;
}

export function initialAlchemy(): AlchemyState {
  return { level: 1, progress: 0 };
}
