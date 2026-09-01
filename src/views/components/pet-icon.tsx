"use client";

import type { ReactNode } from "react";
import { useArt } from "@/controllers/art.context";
import { findPet, type PetGender } from "@/models/entities/pet";
import { GLASS_SECTION } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { ArtImage } from "./art-image";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function PetBanner({ gender }: { gender: PetGender }) {
  const art = useArt();
  const source = art.pets[gender];

  if (!source) return null;

  return (
    <div className="aspect-square w-full overflow-hidden border-b border-edge">
      <ArtImage source={source} />
    </div>
  );
}

export function PetSheetHeader({
  gender,
  children,
}: {
  gender: PetGender;
  children: ReactNode;
}) {
  const art = useArt();
  const source = art.pets[gender];

  if (!source) return null;

  return (
    <div className="relative border-b border-edge">
      <div className="aspect-square w-full overflow-hidden">
        <ArtImage source={source} />
      </div>
      <div className={cn("absolute inset-x-0 bottom-0 border-t border-edge px-4 py-3", GLASS_SECTION)}>
        {children}
      </div>
    </div>
  );
}

export function PetIcon({
  gender,
  size = "large",
  className,
}: {
  gender: PetGender;
  size?: IconSize;
  className?: string;
}) {
  const art = useArt();
  const source = art.pets[gender];

  return (
    <IconFrame size={size} tone="strong" className={className}>
      {source ? (
        <IconArt source={source} padded={false} />
      ) : (
        findPet(gender).label.slice(0, 2).toUpperCase()
      )}
    </IconFrame>
  );
}
