"use client";

import Link from "next/link";
import { useT } from "@/controllers/use-locale";
import { cn } from "@/shared/utils/class-names";
import { FuryRingFrame } from "./fury-ring-frame";

interface LandingCtaButtonProps {
  href: string;
  label: string;
  className?: string;
}

export function LandingCtaButton({ href, label, className }: LandingCtaButtonProps) {
  const t = useT();
  return (
    <Link
      href={href}
      className={cn(
        "landing-hero-shadow-button mx-auto block w-full max-w-xs rounded-md transition-[filter] hover:brightness-110",
        className,
      )}
    >
      <FuryRingFrame
        contentAlign="center"
        fillClassName="min-h-12 w-full transition-colors hover:bg-surface-top"
      >
        <span className="px-8 text-xs font-medium uppercase tracking-[0.16em] text-ember">
          {t(label)}
        </span>
      </FuryRingFrame>
    </Link>
  );
}
