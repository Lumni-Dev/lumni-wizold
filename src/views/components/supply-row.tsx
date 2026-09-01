import type { ReactNode } from "react";
import type { Item } from "@/models/entities/item";
import { formatNumber } from "@/shared/utils/format";
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
    <li className="flex items-center gap-3 p-4">
      <ItemIcon item={item} />
      <RowText title={item.name} description={description} />
      <span className="ml-auto flex shrink-0 items-center gap-3">
        <span className="font-mono text-xs text-ink-soft">x{formatNumber(quantity)}</span>
        {action}
      </span>
    </li>
  );
}
