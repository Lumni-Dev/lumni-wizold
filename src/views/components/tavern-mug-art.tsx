"use client";

import { TAVERN_MUG_PATH } from "@/shared/constants/site";
import { cn } from "@/shared/utils/class-names";
import { IconArt } from "./icon-frame";

export function TavernMugArt({
  unread = 0,
  seated = false,
}: {
  unread?: number;
  seated?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative flex h-full w-full items-center justify-center",
        seated && "drop-shadow-[0_0_14px_rgba(224,141,53,0.5)]",
      )}
    >
      <IconArt
        source={TAVERN_MUG_PATH}
        fit="contain"
        padded={false}
        shadow={false}
        inset="max-h-[92%] max-w-[92%]"
      />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-ember bg-ember px-1 font-mono text-[10px] font-bold tracking-normal text-base">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </span>
  );
}
