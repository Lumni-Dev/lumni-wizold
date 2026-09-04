"use client";

import { useEffect, useState } from "react";
import type { HunterDoing } from "@/models/entities/activity";
import { PRESENCE_POLL_MS } from "@/models/rules/presence";
import { api } from "./api.client";

const NOBODY: Record<string, HunterDoing> = {};
const NO_LEVELS: Record<string, number> = {};

export function useTavernDoing(enabled: boolean) {
  const [doing, setDoing] = useState<Record<string, HunterDoing>>({});
  const [levels, setLevels] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    const load = async () => {
      const answer = await api<{ people: { id: string; doing: HunterDoing; level: number }[] }>(
        "GET",
        "/api/tavern/doing",
      );
      if (!alive || !answer.ok || !answer.data) return;
      const nextDoing: Record<string, HunterDoing> = {};
      const nextLevels: Record<string, number> = {};
      for (const person of answer.data.people) {
        nextDoing[person.id] = person.doing;
        nextLevels[person.id] = person.level;
      }
      setDoing(nextDoing);
      setLevels(nextLevels);
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

  return enabled ? { doing, levels } : { doing: NOBODY, levels: NO_LEVELS };
}
