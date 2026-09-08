"use client";

import { Flame } from "lucide-react";
import { useT } from "@/controllers/use-locale";
import { formatFuryClock } from "@/shared/utils/format";
import { FuryRingFrame } from "./fury-ring-frame";
import { useFuryClock } from "./use-fury-clock";

export function FuryModeTracker({ flush = false }: { flush?: boolean }) {
  const { character, remaining, active, furyUntil } = useFuryClock();
  const t = useT();

  if (!character || !active) return null;

  const frame = (
    <FuryRingFrame
      className="block w-full"
      contentAlign="start"
      fillClassName="w-full"
      animationKey={furyUntil || "sky"}
    >
      <div className="flex w-full items-stretch">
        <span className="flex w-8 shrink-0 items-center justify-center self-stretch border-r border-edge">
          <Flame aria-hidden strokeWidth={1.75} className="h-4 w-4 text-ember" />
        </span>
        <div className="min-w-0 flex-1 px-3 py-2">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-ink">
            {t("Fury Mode")}
          </p>
          <p className="font-mono text-[11px] text-ember">{formatFuryClock(remaining)}</p>
        </div>
      </div>
    </FuryRingFrame>
  );

  // The ring keeps its own frame; flush only gives it a divided cell with air,
  // rendered here so an inactive fury never leaves an empty bordered strip.
  if (!flush) return frame;
  return <div className="border-b border-edge p-3">{frame}</div>;
}
