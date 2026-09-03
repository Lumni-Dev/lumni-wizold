import { TAVERN_MUG_PATH } from "@/shared/constants/site";
import { cn } from "@/shared/utils/class-names";

export function TavernMugArt({
  unread = 0,
  seated = false,
}: {
  unread?: number;
  seated?: boolean;
}) {
  return (
    <span className="relative flex h-full w-full items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={TAVERN_MUG_PATH}
        alt=""
        className={cn(
          "max-h-[92%] max-w-[92%] object-contain",
          seated && "drop-shadow-[0_0_14px_rgba(224,141,53,0.5)]",
        )}
      />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-ember bg-ember px-1 font-mono text-[10px] font-bold tracking-normal text-base">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </span>
  );
}
