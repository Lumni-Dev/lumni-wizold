import type { ReactNode } from "react";
import type { Item } from "@/models/entities/item";
import { ICON_FRAME_INSET } from "@/shared/constants/ui";
import { formatNumber } from "@/shared/utils/format";
import { cn } from "@/shared/utils/class-names";
import { ItemIcon } from "./item-icon";
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
    <li className={cn("flex flex-wrap items-center gap-3 p-4", ICON_FRAME_INSET)}>
      <ItemIcon item={item} />
      <div className="flex min-w-[8rem] flex-1">
        <RowText title={item.name} description={description} />
      </div>
      <span className="ml-auto flex shrink-0 items-center gap-3">
        <span className="font-mono text-xs text-ink-soft">x{formatNumber(quantity)}</span>
        {action}
      </span>
    </li>
  );
}
