"use client";

import { playClick } from "@/controllers/sound";
import { CONTROL_HEIGHT } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { formatFuryClock } from "@/shared/utils/format";
import { Button } from "./button";
import { FuryRingFrame } from "./fury-ring-frame";
import { Tooltip } from "./tooltip";
import { useFuryClock } from "./use-fury-clock";

export function FuryUseButton({
  onClick,
  fullWidth = false,
}: {
  onClick: () => void;
  fullWidth?: boolean;
}) {
  const { remaining, active, sky, furyUntil } = useFuryClock();

  if (!active) {
    return (
      <Button variant="primary" fullWidth={fullWidth} onClick={onClick}>
        Beber
      </Button>
    );
  }

  const label = sky
    ? "A lua cheia já mantém você em fúria."
    : "Beber de novo reinicia o relógio.";

  return (
    <Tooltip label={label} block={fullWidth}>
      <FuryRingFrame
        as="button"
        type="button"
        animationKey={furyUntil || "sky"}
        contentAlign="center"
        disabled={sky}
        aria-disabled={sky || undefined}
        aria-label={sky ? label : "Beber e reiniciar a fúria"}
        onClick={() => {
          if (sky) return;
          playClick();
          onClick();
        }}
        className={cn(
          CONTROL_HEIGHT,
          "cursor-default border-0 bg-transparent p-0 font-[inherit]",
          fullWidth ? "block w-full" : "inline-block",
          !sky && "cursor-pointer",
        )}
        fillClassName={cn("h-full", fullWidth ? "w-full" : "min-w-[4.5rem]")}
      >
        <span className="px-3 font-mono text-[11px] text-ink">
          {sky ? "Lua" : formatFuryClock(remaining)}
        </span>
      </FuryRingFrame>
    </Tooltip>
  );
}
