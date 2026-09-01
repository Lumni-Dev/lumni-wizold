import type { PresenceStatus } from "@/models/entities/presence";
import { cn } from "@/shared/utils/class-names";

const TONES: Record<PresenceStatus, string> = {
  active: "bg-vigor",
  away: "bg-blood",
  offline: "bg-ink-faint",
};

export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  active: "Online na aba do jogo",
  away: "Jogo aberto em segundo plano",
  offline: "Offline",
};

export function PresenceDot({
  status,
  className,
}: {
  status: PresenceStatus;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", TONES[status], className)}
      aria-hidden
    />
  );
}
