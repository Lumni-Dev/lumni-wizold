export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size));
}

export function clampPage(page: number, total: number, size: number): number {
  return Math.max(1, Math.min(pageCount(total, size), Math.floor(page) || 1));
}

export function pageOf<T>(items: readonly T[], page: number, size: number): T[] {
  const safe = clampPage(page, items.length, size);
  return items.slice((safe - 1) * size, safe * size);
}

export function pageOfPosition(position: number, size: number): number {
  return Math.max(1, Math.ceil(position / size));
}
