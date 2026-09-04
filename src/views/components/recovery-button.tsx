"use client";

import type { ReactNode } from "react";
import { Button } from "./button";
import { RestSeconds } from "./rest-seconds";
import { Tooltip } from "./tooltip";

export function RecoveryButton({
  recovering,
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
          {recoveringLabel} <RestSeconds />
        </>
      ) : (
        label
      )}
    </Button>
  );

  return tooltip ? (
    <Tooltip block={fullWidth} className={fullWidth ? "w-full" : undefined} label={tooltip}>
      {button}
    </Tooltip>
  ) : (
    button
  );
}
