"use client";

import { Flame } from "lucide-react";
import { useT } from "@/controllers/use-locale";
import { formatFuryClock } from "@/shared/utils/format";
import { FuryRingFrame } from "./fury-ring-frame";
import { Tooltip } from "./tooltip";
import { useFuryClock } from "./use-fury-clock";

export function FuryModeTracker({ iconOnly = false }: { iconOnly?: boolean }) {
  const { character, remaining, active, furyUntil } = useFuryClock();
  const t = useT();

  if (!character || !active) return null;

  if (iconOnly) {
    return (
      <Tooltip block label={t("Fury Mode") + ": " + formatFuryClock(remaining)}>
        <FuryRingFrame className="mx-auto block w-8" animationKey={furyUntil || "sky"}>
          <div className="flex h-8 w-8 items-center justify-center">
            <Flame aria-hidden strokeWidth={1.75} className="fury-glow-icon h-4 w-4" />
          </div>
        </FuryRingFrame>
      </Tooltip>
    );
  }

  return (
    <FuryRingFrame
      className="block w-full"
      contentAlign="start"
      fillClassName="w-full"
      animationKey={furyUntil || "sky"}
    >
      <div className="flex w-full items-center gap-3 px-2.5 py-2">
        <Flame aria-hidden strokeWidth={1.75} className="fury-glow-icon h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="fury-glow-text truncate text-[10px] uppercase tracking-[0.16em]">
            {t("Fury Mode")}
          </p>
          <p className="font-mono text-[11px] text-ember">{formatFuryClock(remaining)}</p>
        </div>
      </div>
    </FuryRingFrame>
  );
}
