export type ActivityKind = "hunt" | "train" | "mine" | "forge" | "rest";

export interface Activity {
  kind: ActivityKind;
  id?: string;
  enhancement?: number;
  resume?: { kind: ActivityKind; id?: string; enhancement?: number };
  paused?: boolean;
}

export const ACTIVITY_KINDS: readonly ActivityKind[] = ["hunt", "train", "mine", "forge", "rest"];
const KINDS: readonly string[] = ACTIVITY_KINDS;

export type HunterDoing = ActivityKind | "idle";

export const ACTIVITY_STALE_MS = 60000;

export const DOING_VERBS: Record<HunterDoing, string> = {
  hunt: "caçando",
  train: "treinando",
  mine: "minerando",
  forge: "forjando",
  rest: "repousando",
  idle: "parado",
};

export function isActivityKind(value: string): value is ActivityKind {
  return KINDS.includes(value);
}

export function resolveDoing(kind: string | null, at: string | null, now = Date.now()): HunterDoing {
  if (!kind || !at || !isActivityKind(kind)) return "idle";
  if (now - Date.parse(at) > ACTIVITY_STALE_MS) return "idle";
  return kind;
}

export function describeDoing(name: string, doing: HunterDoing): string {
  return name + " está " + DOING_VERBS[doing];
}

export function doingFor(
  id: string,
  selfId: string,
  mine: ActivityKind | null,
  map: Record<string, HunterDoing>,
): HunterDoing {
  if (id === selfId) return mine ?? "idle";
  return map[id] ?? "idle";
}

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
