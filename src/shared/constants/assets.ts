export const ART_VERSION = "?v=35";

export function assetUrl(path: string): string {
  if (!path || path.includes("?")) return path;
  return path + ART_VERSION;
}
