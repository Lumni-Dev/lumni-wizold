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
  fullWidth,
}: {
  recovering: boolean;
  beat: string | number;
  recoveringLabel: string;
  label: ReactNode;
  tooltip?: string | null;
  onClick: () => void;
  size?: "small" | "medium";
  fullWidth?: boolean;
}) {
  const button = (
    <Button
      size={size}
      fullWidth={fullWidth}
      variant={recovering ? "secondary" : "primary"}
      onClick={onClick}
    >
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
