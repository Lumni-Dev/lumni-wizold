"use client";

import { useArt } from "@/controllers/art.context";
import { findAttribute, type AttributeKey } from "@/models/entities/attribute";
import { IconArt } from "./icon-frame";

export function TrainingArtFill({ attribute }: { attribute: AttributeKey }) {
  const art = useArt();
  const source = art.training[attribute] ?? art.attributes[attribute];

  if (!source) {
    return (
      <span className="grid h-full w-full place-items-center font-mono text-sm tracking-widest text-ink-faint">
        {findAttribute(attribute)?.code ?? ""}
      </span>
    );
  }

  return (
    <span className="relative flex h-full w-full">
      <IconArt source={source} padded={false} fit="contain" />
    </span>
  );
}
