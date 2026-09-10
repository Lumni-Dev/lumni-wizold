export type ActivityKind = "hunt" | "train" | "mine" | "forge" | "alchemy" | "rest";

export interface Activity {
  kind: ActivityKind;
  id?: string;
  enhancement?: number;
  resume?: { kind: ActivityKind; id?: string; enhancement?: number };
  paused?: boolean;
  beat?: number;
  laps?: number;
  cooldownUntil?: string;
}

export const ACTIVITY_KINDS: readonly ActivityKind[] = [
  "hunt",
  "train",
  "mine",
  "forge",
  "alchemy",
  "rest",
];
const KINDS: readonly string[] = ACTIVITY_KINDS;

export type WorkActivityKind = Exclude<ActivityKind, "rest">;

export const WORK_ACTIVITY_LABELS: Record<WorkActivityKind, string> = {
  hunt: "Hunt in progress",
  train: "Training in progress",
  mine: "Mining in progress",
  forge: "Forge in progress",
  alchemy: "Cauldron in progress",
};

// Rest may be interrupted by the next job; hunt/train/mine/forge own the body
// until the hunter stops them. Only one of those may run at a time.
export function isWorkActivity(kind: string | null | undefined): kind is WorkActivityKind {
  return (
    kind === "hunt" ||
    kind === "train" ||
    kind === "mine" ||
    kind === "forge" ||
    kind === "alchemy"
  );
}

// The lock is about a job that is RUNNING, never about one parked. A paused
// job is waiting for a resource it cannot fetch by itself: the forge waits for
// fragments the mine digs, the training waits for the bronze the hunt pays. If
// the pause kept the game locked, every button in the game read "Wait..." and
// the only door out was the floating dock, which hides itself on the job's own
// page, so the forge with no fragments waited forever. Parked, it blocks
// nothing: starting anything else simply takes the one slot over.
export function workActivityBlockReason(activity: Activity | null | undefined): string | null {
  if (!activity || !isWorkActivity(activity.kind) || activity.paused === true) return null;
  return WORK_ACTIVITY_LABELS[activity.kind] + ": stop it before starting another.";
}

// The body may not be rearranged mid-job. A running job was started against
// the gear the hunter was wearing, and every lap of it reads that body again:
// pulling a claw off between two beats leaves the report and the sheet
// disagreeing about who did the work. Same shape as the block above, so a
// parked job and a rest, which own no lap, let the gear move freely.
export function gearChangeBlockReason(activity: Activity | null | undefined): string | null {
  if (!activity || !isWorkActivity(activity.kind) || activity.paused === true) return null;
  return WORK_ACTIVITY_LABELS[activity.kind] + ": stop it before taking gear off.";
}

export type HunterDoing = ActivityKind | "idle";

export const ACTIVITY_STALE_MS = 60000;

export const DOING_VERBS: Record<HunterDoing, string> = {
  hunt: "hunting",
  train: "training",
  mine: "mining",
  forge: "forging",
  alchemy: "brewing",
  rest: "resting",
  idle: "idle",
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
  return name + " is " + DOING_VERBS[doing];
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
    (activity.beat === undefined || (typeof activity.beat === "number" && Number.isFinite(activity.beat))) &&
    (activity.laps === undefined ||
      (typeof activity.laps === "number" && Number.isFinite(activity.laps) && activity.laps >= 1)) &&
    (activity.cooldownUntil === undefined || typeof activity.cooldownUntil === "string") &&
    (activity.resume === undefined || isResume(activity.resume))
  );
}
