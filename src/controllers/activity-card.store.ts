let cardVisible = true;
const listeners = new Set<() => void>();

export const activityCardStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  snapshot(): boolean {
    return cardVisible;
  },
  serverSnapshot(): boolean {
    return true;
  },
  set(next: boolean): void {
    if (cardVisible === next) return;
    cardVisible = next;
    for (const listener of listeners) listener();
  },
};
