"use client";

// Whether the game has gone to sleep for lack of interaction (see
// views/components/idle-gate.tsx). The React tree under the gate is unmounted
// while asleep, which clears every effect-owned timer; this flag is for the
// module-level clocks that outlive React, such as the single-tab heartbeat.
let sleeping = false;

export function setSleeping(next: boolean): void {
  sleeping = next;
}

export function isSleeping(): boolean {
  return sleeping;
}
