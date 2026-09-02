import type { PresenceStatus } from "@/models/entities/presence";
import { cn } from "@/shared/utils/class-names";

const TONES: Record<PresenceStatus, string> = {
  active: "bg-vigor",
  away: "bg-blood",
  offline: "bg-ink-faint",
};

const SIZES = {
  default: "size-2",
  small: "size-1.5",
} as const;

export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  active: "Online na aba do jogo",
  away: "Jogo aberto em segundo plano",
  offline: "Offline",
};

export function PresenceDot({
  status,
  size = "default",
  className,
}: {
  status: PresenceStatus;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-block shrink-0 rounded-full", SIZES[size], TONES[status], className)}
      aria-hidden
    />
  );
}
