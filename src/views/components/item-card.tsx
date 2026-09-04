"use client";

import type { ReactNode } from "react";
import type { Item } from "@/models/entities/item";
import { useGame } from "@/controllers/game.context";
import { itemSubtitle, summarizeEffect } from "../presenters/item.presenter";
import { Card, CardBody, CardFooter, CardHeader } from "./card";
import { ItemBanner, ItemIcon, useItemArt } from "./item-icon";
import { RowText } from "./list";
import { Tag } from "./tag";

interface ItemCardProps {
  item: Item;
  quantity?: number;
  enhancement?: number;
  footer?: ReactNode;
  note?: ReactNode;
  highlighted?: boolean;
  fromBazaar?: boolean;
  height?: "content" | "fill";
}

export function ItemCard({
  item,
  quantity,
  enhancement = 0,
  footer,
  note,
  highlighted = false,
  fromBazaar = false,
  height = "fill",
}: ItemCardProps) {
  const { stats } = useGame();
  const willpower = stats
    ? stats.totalAttributes.willpower - stats.sources.fury.willpower
    : undefined;
  const effects = summarizeEffect(item, enhancement, willpower);
  const drawn = Boolean(useItemArt(item));

  return (
    <Card tone={highlighted ? "highlighted" : "default"} height={height} interactive>
      {drawn ? <ItemBanner item={item} enhancement={enhancement} /> : null}

      <CardHeader>
        {drawn ? null : <ItemIcon item={item} enhancement={enhancement} />}
        <RowText title={item.name} description={itemSubtitle(item)} />
        {quantity && quantity > 1 ? (
          <span className="shrink-0 font-mono text-xs text-ink-soft">x{quantity}</span>
        ) : null}
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
