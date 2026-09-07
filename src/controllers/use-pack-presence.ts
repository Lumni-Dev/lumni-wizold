"use client";

import { useEffect, useState } from "react";
import type { PresenceStatus } from "@/models/entities/presence";
import { PRESENCE_POLL_MS } from "@/models/rules/presence";
import { api } from "./api.client";

export interface PackPresenceView {
  statuses: Record<string, PresenceStatus>;
  vips: Record<string, boolean>;
}

const NOBODY: PackPresenceView = { statuses: {}, vips: {} };

export function usePackPresence(mateIds: string[], enabled: boolean): PackPresenceView {
  const [presence, setPresence] = useState<PackPresenceView>(NOBODY);
  const roster = mateIds.join(",");
  const watching = enabled && mateIds.length > 0;

  useEffect(() => {
    if (!watching) return;

    let alive = true;
    const load = async () => {
      const answer = await api<{
        mates: { id: string; status: PresenceStatus; vip?: boolean }[];
      }>("GET", "/api/pack/presence");
      if (!alive || !answer.ok || !answer.data) return;
      const statuses: Record<string, PresenceStatus> = {};
      const vips: Record<string, boolean> = {};
      for (const mate of answer.data.mates) {
        statuses[mate.id] = mate.status;
        vips[mate.id] = mate.vip === true;
      }
      setPresence({ statuses, vips });
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
  }, [watching, roster]);

  return watching ? presence : NOBODY;
}

