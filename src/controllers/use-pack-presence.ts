"use client";

import { useEffect, useState } from "react";
import type { PresenceStatus } from "@/models/entities/presence";
import { refreshPackPresence, subscribePackPresence } from "./pack-presence.poll";

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

    const stop = subscribePackPresence((mates) => {
      const statuses: Record<string, PresenceStatus> = {};
      const vips: Record<string, boolean> = {};
      for (const mate of mates) {
        statuses[mate.id] = mate.status;
        vips[mate.id] = mate.vip === true;
      }
      setPresence({ statuses, vips });
    });
    refreshPackPresence();
    return stop;
  }, [watching, roster]);

  return watching ? presence : NOBODY;
}

