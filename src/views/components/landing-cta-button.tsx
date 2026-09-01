"use client";

import Link from "next/link";
import { cn } from "@/shared/utils/class-names";
import { FuryRingFrame } from "./fury-ring-frame";

interface LandingCtaButtonProps {
  href: string;
  label: string;
  className?: string;
}

export function LandingCtaButton({ href, label, className }: LandingCtaButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "landing-hero-shadow-button block w-full max-w-xs rounded-md transition-[filter] hover:brightness-110",
        className,
      )}
    >
      <FuryRingFrame
        className="rounded-md"
        fillClassName={
          "flex h-12 w-full items-center justify-center px-8 text-xs font-medium uppercase " +
          "tracking-[0.16em] text-ember bg-surface/70 transition-colors hover:bg-surface-high/80"
        }
      >
        {label}
      </FuryRingFrame>
    </Link>
  );
}
