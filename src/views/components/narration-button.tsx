"use client";

import { useT } from "@/controllers/use-locale";
import { ActionIcon } from "./app-icon";
import { Button } from "./button";
import { Spinner } from "./spinner";

export function NarrationButton({
  playing,
  loading = false,
  onClick,
  label = "Ouvir este capítulo",
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
      aria-label={playing ? "Parar a narração" : label}
      aria-busy={loading || undefined}
    >
      {loading ? <Spinner tone="ember" /> : <ActionIcon action={playing ? "pause" : "play"} />}
      {t(playing ? "Parar" : loading ? "Carregando..." : "Ouvir")}
    </Button>
  );
}
