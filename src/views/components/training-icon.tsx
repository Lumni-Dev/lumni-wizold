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
      {source ? <IconArt source={source} padded={false} /> : (findAttribute(attribute)?.code ?? "")}
    </IconFrame>
  );
}

export function TrainingBanner({ attribute }: { attribute: AttributeKey }) {
  const art = useArt();
  const source = art.training[attribute] ?? art.attributes[attribute];

  if (!source) return null;

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden border-b border-edge">
      <IconArt source={source} padded={false} />
    </div>
  );
}
