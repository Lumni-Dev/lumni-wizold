"use client";

import { api } from "./api.client";

export interface RadioTrack {
  name: string;
  url: string;
}

interface RadioState {
  tracks: RadioTrack[];
  index: number;
  loaded: boolean;
}

const EMPTY: RadioState = { tracks: [], index: 0, loaded: false };

let state: RadioState = EMPTY;
let loading = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function set(next: RadioState): void {
  state = next;
  emit();
}

export const radioStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  snapshot(): RadioState {
    return state;
  },
  serverSnapshot(): RadioState {
    return EMPTY;
  },
  load(): void {
    if (loading || state.loaded || typeof window === "undefined") return;
    loading = true;
    void api<{ tracks: RadioTrack[] }>("GET", "/api/radio")
      .then((answer) => {
        const tracks = answer.ok && answer.data ? answer.data.tracks : [];
        set({ tracks, index: 0, loaded: true });
      })
      .finally(() => {
        loading = false;
      });
  },
  reload(): void {
    loading = false;
    set({ ...state, loaded: false });
    this.load();
  },
  current(): RadioTrack | null {
    return state.tracks[state.index] ?? null;
  },
  next(): void {
    if (state.tracks.length === 0) return;
    set({ ...state, index: (state.index + 1) % state.tracks.length });
  },
  prev(): void {
    if (state.tracks.length === 0) return;
    set({ ...state, index: (state.index - 1 + state.tracks.length) % state.tracks.length });
  },
};
