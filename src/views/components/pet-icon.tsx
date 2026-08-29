"use client";

import { useArt } from "@/controllers/art.context";
import { findPet, type PetGender } from "@/models/entities/pet";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

export function PetIcon({
  gender,
  size = "large",
  shine,
  className,
}: {
  gender: PetGender;
  size?: IconSize;
  shine?: boolean;
  className?: string;
}) {
  const art = useArt();
  const source = art.pets[gender];

  return (
    <IconFrame size={size} tone="strong" shine={shine} className={className}>
      {source ? (
        <IconArt source={source} padded={false} inset="p-[6px]" />
      ) : (
        findPet(gender).label.slice(0, 2).toUpperCase()
      )}
    </IconFrame>
  );
}
