type RevisionListener = (revision: number) => void;

const listeners = new Set<RevisionListener>();

export function publishTavernRevision(revision: number): void {
  for (const listener of listeners) listener(revision);
}

export function subscribeTavernRevision(listener: RevisionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
