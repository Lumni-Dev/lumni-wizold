export interface ArtManifest {
  items: Record<string, string>;
  attributes: Record<string, string>;
  training: Record<string, string>;
  territories: Record<string, string>;
  territoryVideos: Record<string, string>;
  creatures: Record<string, string>;
  pet: string | undefined;
  genders: Record<string, string>;
  packs: Record<string, string>;
  emptySlots: Record<string, string>;
}

export const EMPTY_ART: ArtManifest = {
  items: {},
  attributes: {},
  training: {},
  territories: {},
  territoryVideos: {},
  creatures: {},
  pet: undefined,
  genders: {},
  packs: {},
  emptySlots: {},
};
