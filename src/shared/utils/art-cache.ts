const warmed = new Set<string>();

export function isArtCached(url: string): boolean {
  return warmed.has(url);
}

export function markArtCached(url: string): void {
  warmed.add(url);
}

export function artLoadedFromImg(url: string, img: HTMLImageElement | null): boolean {
  if (isArtCached(url)) return true;
  if (img?.complete && img.naturalWidth > 0) {
    markArtCached(url);
    return true;
  }
  return false;
}
