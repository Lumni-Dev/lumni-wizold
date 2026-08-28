export interface ArtManifest {
  items: Record<string, string>;
  attributes: Record<string, string>;
  training: Record<string, string>;
  territories: Record<string, string>;
  pets: Record<string, string>;
  genders: Record<string, string>;
  packs: Record<string, string>;
}

export const EMPTY_ART: ArtManifest = {
  items: {},
  attributes: {},
  training: {},
  territories: {},
  pets: {},
  genders: {},
  packs: {},
};
