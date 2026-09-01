"use client";

import { useEffect, useState } from "react";
import type { PresenceStatus } from "@/models/entities/presence";
import { PRESENCE_POLL_MS } from "@/models/rules/presence";
import { api } from "./api.client";

export function usePackPresence(mateIds: string[], enabled: boolean) {
  const [presence, setPresence] = useState<Record<string, PresenceStatus>>({});
  const roster = mateIds.join(",");

  useEffect(() => {
    if (!enabled || mateIds.length === 0) {
      setPresence({});
      return;
    }

    let alive = true;
    const load = async () => {
      const answer = await api<{ mates: { id: string; status: PresenceStatus }[] }>(
        "GET",
        "/api/pack/presence",
      );
      if (!alive || !answer.ok || !answer.data) return;
      const next: Record<string, PresenceStatus> = {};
      for (const mate of answer.data.mates) next[mate.id] = mate.status;
      setPresence(next);
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
  }, [enabled, roster, mateIds.length]);

  return presence;
}
