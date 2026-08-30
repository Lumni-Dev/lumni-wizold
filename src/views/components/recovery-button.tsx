"use client";

import type { ReactNode } from "react";
import { Button } from "./button";
import { RestSeconds } from "./rest-seconds";
import { Tooltip } from "./tooltip";

export function RecoveryButton({
  recovering,
  beat,
  recoveringLabel,
  label,
  tooltip,
  onClick,
  size,
}: {
  recovering: boolean;
  beat: string | number;
  recoveringLabel: string;
  label: ReactNode;
  tooltip?: string | null;
  onClick: () => void;
  size?: "small" | "medium";
}) {
  const button = (
    <Button size={size} variant={recovering ? "secondary" : "primary"} onClick={onClick}>
      {recovering ? (
        <>
          {recoveringLabel} <RestSeconds key={beat} />
        </>
      ) : (
        label
      )}
    </Button>
  );

  return tooltip ? <Tooltip label={tooltip}>{button}</Tooltip> : button;
}
