"use client";

import { useT } from "@/controllers/use-locale";
import { ActionIcon } from "./app-icon";
import { Button } from "./button";
import { Spinner } from "./spinner";

export function NarrationButton({
  playing,
  loading = false,
  onClick,
  label = "Listen to this chapter",
}: {
  playing: boolean;
  loading?: boolean;
  onClick: () => void;
  label?: string;
}) {
  const t = useT();
  return (
    <Button
      variant="ghost"
      className="shrink-0"
      onClick={onClick}
      aria-label={playing ? "Stop the narration" : label}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner tone="ember" /> : <ActionIcon action={playing ? "pause" : "play"} />}
      {t(playing ? "Stop" : loading ? "Loading..." : "Listen")}
    </Button>
  );
}
