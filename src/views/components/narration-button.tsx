"use client";

import { ActionIcon } from "./app-icon";
import { Button } from "./button";

export function NarrationButton({
  playing,
  onClick,
  label = "Ouvir este capítulo",
}: {
  playing: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      variant="ghost"
      className="shrink-0"
      onClick={onClick}
      aria-label={playing ? "Parar a narração" : label}
    >
      <ActionIcon action={playing ? "pause" : "play"} />
      {playing ? "Parar" : "Ouvir"}
    </Button>
  );
}
