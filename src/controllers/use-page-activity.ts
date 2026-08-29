"use client";

import { useEffect, useRef } from "react";
import type { ActivityKind } from "@/models/entities/activity";
import { useGame } from "./game.context";

export function usePageActivity(kinds: readonly ActivityKind[]) {
  const { activity, setActivity } = useGame();
  const currentRef = useRef({ activity, setActivity, kinds });
  useEffect(() => {
    currentRef.current = { activity, setActivity, kinds };
  });

  useEffect(() => {
    const entering = currentRef.current;
    if (
      entering.activity &&
      entering.activity.kind !== "rest" &&
      !entering.kinds.includes(entering.activity.kind)
    ) {
      entering.setActivity(null);
    }
    return () => {
      const current = currentRef.current;
      if (current.activity && current.kinds.includes(current.activity.kind)) {
        current.setActivity(null);
      }
    };
  }, []);
}
