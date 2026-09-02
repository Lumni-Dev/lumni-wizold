"use client";

import { useEffect, useRef } from "react";
import type { ActivityKind } from "@/models/entities/activity";
import { PRESENCE_HEARTBEAT_MS } from "@/models/rules/presence";
import { api } from "./api.client";

function currentStatus(): "active" | "away" {
  return document.visibilityState === "visible" ? "active" : "away";
}

export function usePresenceHeartbeat(enabled: boolean, doing: ActivityKind | null) {
  const doingRef = useRef(doing);
  doingRef.current = doing;

  useEffect(() => {
    if (!enabled) return;

    const ping = (status: "active" | "away") => {
      void api("PATCH", "/api/presence", { status, activity: doingRef.current });
    };

    const sync = () => {
      ping(currentStatus());
    };

    sync();
    const timer = window.setInterval(sync, PRESENCE_HEARTBEAT_MS);

    const onVisibility = () => {
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const offline = () => {
      if (typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/presence/offline");
        return;
      }
      void api("POST", "/api/presence/offline");
    };
    window.addEventListener("pagehide", offline);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", offline);
    };
  }, [enabled]);
}
