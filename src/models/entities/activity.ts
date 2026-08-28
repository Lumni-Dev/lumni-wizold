export type ActivityKind = "hunt" | "train" | "mine" | "forge" | "rest";

export interface Activity {
  kind: ActivityKind;
  id?: string;
  resume?: { kind: ActivityKind; id?: string };
  paused?: boolean;
}

const KINDS: readonly string[] = ["hunt", "train", "mine", "forge", "rest"];

export function isActivity(data: unknown): data is Activity {
  if (typeof data !== "object" || data === null) return false;
  const activity = data as Partial<Activity>;
  return (
    typeof activity.kind === "string" &&
    KINDS.includes(activity.kind) &&
    (activity.id === undefined || typeof activity.id === "string") &&
    (activity.paused === undefined || typeof activity.paused === "boolean")
  );
}
