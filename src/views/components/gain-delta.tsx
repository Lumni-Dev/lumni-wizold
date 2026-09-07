"use client";

import { formatNumber } from "@/shared/utils/format";
import { useGained } from "./use-gained";

export function GainDelta({ total, sign = "+" }: { total: number; sign?: "+" | "-" }) {
  const gained = useGained(total);
  if (gained <= 0) return null;
  return (
    <>
      {sign}
      {formatNumber(gained)}
    </>
  );
}
