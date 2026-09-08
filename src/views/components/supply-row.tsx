import type { ReactNode } from "react";
import type { Item } from "@/models/entities/item";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { formatNumber } from "@/shared/utils/format";
import { cn } from "@/shared/utils/class-names";
import { ItemArtFill } from "./item-icon";
import { RowText } from "./list";

export function SupplyRow({
  item,
  quantity,
  description,
  action,
}: {
  item: Item;
  quantity: number;
  description: string;
  action: ReactNode;
}) {
  return (
    <li className="flex items-stretch">
      <div
        className={cn(
          "flex min-w-0 grow flex-wrap items-center gap-3 px-4 py-3",
          ICON_FRAME_INSET,
        )}
      >
        <div className="flex min-w-[8rem] flex-1">
          <RowText title={item.name} description={description} />
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          <span className="font-mono text-xs text-ink-soft">x{formatNumber(quantity)}</span>
          {action}
        </span>
      </div>
      <span className="flex aspect-square w-16 shrink-0 overflow-hidden border-l border-edge p-2 sm:w-20">
        <ItemArtFill item={item} />
      </span>
    </li>
  );
}
