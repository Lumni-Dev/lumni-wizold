"use client";

import type { ReactNode } from "react";
import { useArt } from "@/controllers/art.context";
import { findGender, type Gender } from "@/models/entities/character";
import { GLASS_SECTION } from "@/shared/constants/ui";
import { cn } from "@/shared/utils/class-names";
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
        <IconArt source={source} padded={false} fit="contain" />
      ) : (
        findGender(gender).label.slice(0, 1)
      )}
    </IconFrame>
  );
}

export function GenderArtFill({ gender }: { gender: Gender }) {
  const art = useArt();
  const source = art.genders[gender];

  if (!source) {
    return (
      <span className="grid h-full w-full place-items-center font-mono text-sm tracking-widest text-ink-faint">
        {findGender(gender).label.slice(0, 1)}
      </span>
    );
  }

  return (
    <span className="relative flex h-full w-full">
      <IconArt source={source} padded={false} fit="contain" />
    </span>
  );
}

export function GenderBanner({ gender }: { gender: Gender }) {
  const art = useArt();
  const source = art.genders[gender];

  if (!source) return null;

  return (
    <div className="aspect-square w-full border-b border-edge p-5">
      <ArtImage source={source} fit="contain" />
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
      <div className="aspect-square w-full overflow-hidden p-4">
        <ArtImage source={source} fit="contain" />
      </div>
      <div className={cn("absolute inset-x-0 bottom-0 border-t border-edge px-4 py-3", GLASS_SECTION)}>
        {children}
      </div>
    </div>
  );
}
