"use client";

import { useArt } from "@/controllers/art.context";
import { PET_TITLE } from "@/models/entities/pet";
import { ArtImage } from "./art-image";
import { IconArt, IconFrame, type IconSize } from "./icon-frame";

const PET_ART_SCALE = "scale-[1.28] origin-center";
const PET_ART_IMAGE_CLASS = "[&_img]:origin-center [&_img]:scale-[1.28]";

export function PetPortrait() {
  const art = useArt();
  const source = art.pet;

  if (!source) return <PetIcon size="large" />;

  return <ArtImage source={source} fit="contain" className={PET_ART_IMAGE_CLASS} />;
}

export function PetIcon({
  size = "large",
  className,
}: {
  size?: IconSize;
  className?: string;
}) {
  const art = useArt();
  const source = art.pet;

  return (
    <IconFrame size={size} tone="strong" className={className}>
      {source ? (
        <IconArt source={source} padded={false} fit="contain" inset={PET_ART_SCALE} />
      ) : (
        PET_TITLE.slice(0, 2).toUpperCase()
      )}
    </IconFrame>
  );
}

export function PetArtFill() {
  const art = useArt();
  const source = art.pet;

  if (!source) {
    return (
      <span className="grid h-full w-full place-items-center font-mono text-sm tracking-widest text-ink-faint">
        {PET_TITLE.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span className="relative flex h-full w-full">
      <IconArt source={source} padded={false} fit="contain" inset={PET_ART_SCALE} />
    </span>
  );
}

export function PetKennelArt() {
  const art = useArt();
  const source = art.pet;

  if (!source) {
    return (
      <span className="grid h-full w-full place-items-center font-mono text-sm tracking-widest text-ink-faint">
        {PET_TITLE.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return <IconArt source={source} fit="contain" />;
}
