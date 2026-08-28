"use client";

import { useArt } from "@/controllers/art.context";
import { findAttribute, type AttributeKey } from "@/models/entities/attribute";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function TrainingIcon({
  attribute,
  size = "medium",
  className,
}: {
  attribute: AttributeKey;
  size?: IconSize;
  className?: string;
}) {
  const art = useArt();
  const source = art.training[attribute] ?? art.attributes[attribute];

  return (
    <IconFrame size={size} className={className}>
      {source ? (
        <IconArt source={source} padded={false} inset="p-[6px]" />
      ) : (
        (findAttribute(attribute)?.code ?? "")
      )}
    </IconFrame>
  );
}
