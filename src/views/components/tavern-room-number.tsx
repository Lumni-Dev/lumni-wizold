"use client";

import { roomNumberLabel } from "@/models/entities/tavern";
import { cn } from "@/shared/utils/class-names";
import { CopyValue } from "./copy-nick";

export function TavernRoomNumber({
  number,
  className,
}: {
  number: number;
  className?: string;
}) {
  const mark = roomNumberLabel(number);

  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <span className={cn("font-mono text-ink", className)}>{mark}</span>
      <CopyValue value={mark} noun="número da mesa" />
    </span>
  );
}
