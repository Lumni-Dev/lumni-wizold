"use client";

import type { ReactNode } from "react";
import { useArt } from "@/controllers/art.context";
import { findGender, type Gender } from "@/models/entities/character";
import { ArtImage } from "./art-image";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function GenderIcon({
  gender,
  size = "large",
  className,
}: {
  gender: Gender;
  size?: IconSize;
  className?: string;
}) {
  const art = useArt();
  const source = art.genders[gender];

  return (
    <IconFrame size={size} tone="strong" className={className}>
      {source ? (
        <IconArt source={source} padded={false} />
      ) : (
        findGender(gender).label.slice(0, 1)
      )}
    </IconFrame>
  );
}

export function GenderBanner({ gender }: { gender: Gender }) {
  const art = useArt();
  const source = art.genders[gender];

  if (!source) return null;

  return (
    <div className="aspect-square w-full overflow-hidden border-b border-edge">
      <ArtImage source={source} />
    </div>
  );
}

export function GenderSheetHeader({
  gender,
  children,
}: {
  gender: Gender;
  children: ReactNode;
}) {
  const art = useArt();
  const source = art.genders[gender];

  if (!source) return null;

  return (
    <div className="relative border-b border-edge">
      <div className="aspect-square w-full overflow-hidden">
        <ArtImage source={source} />
      </div>
      <div className="absolute inset-x-0 bottom-0 border-t border-edge bg-surface-high/40 px-4 py-3 backdrop-blur">
        {children}
      </div>
    </div>
  );
}
