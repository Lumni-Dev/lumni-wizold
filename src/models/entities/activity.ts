export type ActivityKind = "hunt" | "train" | "mine" | "forge" | "rest";

export interface Activity {
  kind: ActivityKind;
  id?: string;
  enhancement?: number;
  resume?: { kind: ActivityKind; id?: string; enhancement?: number };
  paused?: boolean;
}

const KINDS: readonly string[] = ["hunt", "train", "mine", "forge", "rest"];

function isResume(data: unknown): data is { kind: ActivityKind; id?: string; enhancement?: number } {
  if (typeof data !== "object" || data === null) return false;
  const resume = data as { kind?: unknown; id?: unknown; enhancement?: unknown };
  return (
    typeof resume.kind === "string" &&
    KINDS.includes(resume.kind) &&
    (resume.id === undefined || typeof resume.id === "string") &&
    (resume.enhancement === undefined || typeof resume.enhancement === "number")
  );
}

export function isActivity(data: unknown): data is Activity {
  if (typeof data !== "object" || data === null) return false;
  const activity = data as Partial<Activity>;
  return (
    typeof activity.kind === "string" &&
    KINDS.includes(activity.kind) &&
    (activity.id === undefined || typeof activity.id === "string") &&
    (activity.enhancement === undefined || typeof activity.enhancement === "number") &&
    (activity.paused === undefined || typeof activity.paused === "boolean") &&
    (activity.resume === undefined || isResume(activity.resume))
  );
}
