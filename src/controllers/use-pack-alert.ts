"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PresenceStatus } from "@/models/entities/presence";
import { PRESENCE_POLL_MS } from "@/models/rules/presence";
import { api } from "./api.client";
import { useGame } from "./game.context";
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

    let alive = true;

    const load = async () => {
      const answer = await api<{ mates: { id: string; status: PresenceStatus }[] }>(
        "GET",
        "/api/pack/presence",
      );
      if (!alive || !answer.ok || !answer.data) return;

      const now: Record<string, PresenceStatus> = {};
      for (const mate of answer.data.mates) now[mate.id] = mate.status;

      const before = seenRef.current;
      if (before) {
        for (const [id, status] of Object.entries(now)) {
          if (status !== "active") continue;
          const was = before[id];
          if (was === undefined || was === "active") continue;
          const name = namesRef.current[id];
          if (name) notifyRef.current(name + " está online.", true, "Matilha", "active");
        }
      }
      seenRef.current = now;
    };

    void load();
    const timer = window.setInterval(() => void load(), PRESENCE_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, roster]);
}
