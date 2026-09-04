"use client";

import type { ReactNode } from "react";
import { useArt } from "@/controllers/art.context";
import { findPet, type PetGender } from "@/models/entities/pet";
import { GLASS_SECTION } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
import { ArtImage } from "./art-image";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

const PET_ART_SCALE = "scale-[1.28] origin-center";
const PET_ART_IMAGE_CLASS = "[&_img]:origin-center [&_img]:scale-[1.28]";

export function PetLandingBanner({ gender }: { gender: PetGender }) {
  const art = useArt();
  const source = art.pets[gender];

  if (!source) return null;

  return (
    <div className="aspect-square w-full border-b border-edge p-5">
      <ArtImage source={source} fit="contain" />
    </div>
  );
}

export function PetPortrait({ gender }: { gender: PetGender }) {
  const art = useArt();
  const source = art.pets[gender];

  if (!source) return <PetIcon gender={gender} size="large" />;

  return <ArtImage source={source} fit="contain" className={PET_ART_IMAGE_CLASS} />;
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
      <div className="aspect-[3/2] w-full overflow-hidden">
        <span className="relative flex h-full w-full items-center justify-center">
          <IconArt source={source} padded={false} fit="contain" inset={PET_ART_SCALE} />
        </span>
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
        <IconArt source={source} padded={false} fit="contain" inset={PET_ART_SCALE} />
      ) : (
        findPet(gender).label.slice(0, 2).toUpperCase()
      )}
    </IconFrame>
  );
}

export function PetArtFill({ gender }: { gender: PetGender }) {
  const art = useArt();
  const source = art.pets[gender];

  if (!source) {
    return (
      <span className="grid h-full w-full place-items-center font-mono text-sm tracking-widest text-ink-faint">
        {findPet(gender).label.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span className="relative flex h-full w-full">
      <IconArt source={source} padded={false} fit="contain" inset={PET_ART_SCALE} />
    </span>
  );
}
