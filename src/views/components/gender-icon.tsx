"use client";

import { useArt } from "@/controllers/art.context";
import { findGender, type Gender } from "@/models/entities/character";
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={source} alt="" loading="lazy" className="h-full w-full object-cover" />
    </div>
  );
}
