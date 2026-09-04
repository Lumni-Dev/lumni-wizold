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
  playing: boolean;
}

const EMPTY: RadioState = { tracks: [], index: 0, loaded: false, playing: false };

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
        const index = tracks.length > 0 ? Math.floor(Math.random() * tracks.length) : 0;
        set({ tracks, index, loaded: true, playing: state.playing });
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
  setPlaying(on: boolean): void {
    if (state.playing === on) return;
    set({ ...state, playing: on });
  },
  isPlaying(): boolean {
    return state.playing;
  },
  next(): void {
    const total = state.tracks.length;
    if (total === 0) return;
    if (total === 1) {
      set({ ...state, index: 0 });
      return;
    }
    const draw = Math.floor(Math.random() * (total - 1));
    const index = draw >= state.index ? draw + 1 : draw;
    set({ ...state, index });
  },
};
