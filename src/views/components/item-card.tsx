import type { ReactNode } from "react";
import type { Item } from "@/models/entities/item";
import { enhancedName } from "@/models/rules/forge";
import { itemSubtitle, summarizeEffect } from "../presenters/item.presenter";
import { Card, CardBody, CardFooter, CardHeader } from "./card";
import { ItemIcon } from "./item-icon";
import { Tag } from "./tag";

interface ItemCardProps {
  item: Item;
  quantity?: number;
  enhancement?: number;
  footer?: ReactNode;
  note?: string | null;
  highlighted?: boolean;
  fromBazaar?: boolean;
}

export function ItemCard({
  item,
  quantity,
  enhancement = 0,
  footer,
  note,
  highlighted = false,
  fromBazaar = false,
}: ItemCardProps) {
  const effects = summarizeEffect(item, enhancement);

  return (
    <Card tone={highlighted ? "highlighted" : "default"} height="fill" interactive>
      <CardHeader>
        <ItemIcon item={item} enhancement={enhancement} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-medium text-ink">
              {enhancedName(item.name, enhancement)}
            </h3>
            {quantity && quantity > 1 ? (
              <span className="font-mono text-xs text-ink-soft">x{quantity}</span>
            ) : null}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            {itemSubtitle(item)}
          </p>
        </div>
      </CardHeader>

      <CardBody>
        <p className="grow text-xs leading-relaxed text-ink-faint">{item.description}</p>

        {effects.length > 0 || fromBazaar ? (
          <ul className="flex flex-wrap gap-2">
            {fromBazaar ? (
              <li>
                <Tag tone="light">Bazar</Tag>
              </li>
            ) : null}
            {effects.map((effect, index) => (
              <li key={index}>
                <Tag tone="neutral">{effect}</Tag>
              </li>
            ))}
          </ul>
        ) : null}

        {note ? <p className="text-[11px] text-ink-faint">{note}</p> : null}
      </CardBody>

      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
