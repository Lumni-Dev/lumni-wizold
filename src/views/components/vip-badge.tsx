"use client";

import { cn } from "@/shared/utils/class-names";
import { FuryRingFrame } from "./fury-ring-frame";
import { Tooltip } from "./tooltip";

export function VipBadge({ className }: { className?: string }) {
  return (
    <Tooltip label="VIP subscriber">
      <FuryRingFrame as="span" className={cn("inline-flex shrink-0 align-middle", className)}>
        <span className="px-1.5 text-[9px] font-bold uppercase leading-4 tracking-[0.16em] text-ember">
          VIP
        </span>
      </FuryRingFrame>
    </Tooltip>
  );
}
