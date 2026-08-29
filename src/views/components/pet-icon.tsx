"use client";

import { useArt } from "@/controllers/art.context";
import { findPet, type PetGender } from "@/models/entities/pet";
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
