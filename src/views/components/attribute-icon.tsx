"use client";

import { useArt } from "@/controllers/art.context";
import { findAttribute, type AttributeKey } from "@/models/entities/attribute";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function AttributeIcon({
  attribute,
  size = "small",
  shine,
  className,
}: {
  attribute: AttributeKey;
  size?: IconSize;
  shine?: boolean;
  className?: string;
}) {
  const art = useArt();
  const source = art.attributes[attribute];

  return (
    <IconFrame size={size} shine={shine} className={className}>
      {source ? (
        <IconArt source={source} padded={false} inset="p-[6px]" />
      ) : (
        (findAttribute(attribute)?.code ?? "")
      )}
    </IconFrame>
  );
}
