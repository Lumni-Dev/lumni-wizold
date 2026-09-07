"use client";

import { formatNumber } from "@/shared/utils/format";
import { useGained } from "./use-gained";

export function GainDelta({
  total,
  sign = "+",
  className,
}: {
  total: number;
  sign?: "+" | "-";
  className?: string;
}) {
  const gained = useGained(total);
  if (gained <= 0) return null;
  const text = sign + formatNumber(gained);
  return className ? <span className={className}>{text}</span> : <>{text}</>;
}
