const readyAt = new Map<string, number>();

export function cooldownLeft(key: string): number {
  const at = readyAt.get(key);
  if (at === undefined) return 0;
  const left = at - Date.now();
  if (left <= 0) {
    readyAt.delete(key);
    return 0;
  }
  return left;
}

export function setCooldown(key: string, ms: number): void {
  readyAt.set(key, Date.now() + Math.max(0, ms));
}
