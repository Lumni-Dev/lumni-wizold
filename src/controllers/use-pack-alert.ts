"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PresenceStatus } from "@/models/entities/presence";
import { useGame } from "./game.context";
import { refreshPackPresence, subscribePackPresence } from "./pack-presence.poll";
import { listPack } from "./pack.controller";

export function usePackAlert(watching: boolean) {
  const { state, character, authenticated, notify } = useGame();
  const mates = useMemo(() => listPack(state), [state]);
  const roster = mates.map((mate) => mate.id).join(",");
  const enabled = watching && authenticated && character !== null && mates.length > 0;

  const namesRef = useRef<Record<string, string>>({});
  const notifyRef = useRef(notify);
  const seenRef = useRef<Record<string, PresenceStatus> | null>(null);

  useEffect(() => {
    const names: Record<string, string> = {};
    for (const mate of mates) names[mate.id] = mate.name;
    namesRef.current = names;
    notifyRef.current = notify;
  });

  useEffect(() => {
    if (!enabled) return;

    const onMates = (mates: { id: string; status: PresenceStatus }[]) => {
      const now: Record<string, PresenceStatus> = {};
      for (const mate of mates) now[mate.id] = mate.status;

      const before = seenRef.current;
      if (before) {
        for (const [id, status] of Object.entries(now)) {
          if (status !== "active") continue;
          const was = before[id];
          if (was === undefined || was === "active") continue;
          const name = namesRef.current[id];
          if (name) notifyRef.current(name + " is online.", true, "Pack", "active", true);
        }
      }
      seenRef.current = now;
    };

    const stop = subscribePackPresence(onMates);
    refreshPackPresence();
    return stop;
  }, [enabled, roster]);
}
