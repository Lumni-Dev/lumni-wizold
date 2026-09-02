"use client";

import { useEffect, useState } from "react";
import type { HunterDoing } from "@/models/entities/activity";
import { PRESENCE_POLL_MS } from "@/models/rules/presence";
import { api } from "./api.client";

const NOBODY: Record<string, HunterDoing> = {};

export function useTavernDoing(enabled: boolean) {
  const [doing, setDoing] = useState<Record<string, HunterDoing>>({});

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    const load = async () => {
      const answer = await api<{ people: { id: string; doing: HunterDoing }[] }>(
        "GET",
        "/api/tavern/doing",
      );
      if (!alive || !answer.ok || !answer.data) return;
      const next: Record<string, HunterDoing> = {};
      for (const person of answer.data.people) next[person.id] = person.doing;
      setDoing(next);
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
  }, [enabled]);

  return enabled ? doing : NOBODY;
}
