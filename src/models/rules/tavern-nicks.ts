import {
  MAX_ROOM_MEMBERS,
  type TavernIdentity,
  type TavernMember,
  type TavernRoom,
} from "../entities/tavern";

export const NICK_COLOR_COUNT = MAX_ROOM_MEMBERS;

export const NICK_COLOR_CLASSES = [
  "text-nick-0",
  "text-nick-1",
  "text-nick-2",
  "text-nick-3",
  "text-nick-4",
  "text-nick-5",
  "text-nick-6",
  "text-nick-7",
  "text-nick-8",
  "text-nick-9",
  "text-nick-10",
  "text-nick-11",
  "text-nick-12",
  "text-nick-13",
  "text-nick-14",
  "text-nick-15",
  "text-nick-16",
  "text-nick-17",
  "text-nick-18",
  "text-nick-19",
] as const;

export function nickColorCapacity(room: Pick<TavernRoom, "privateFor">): number {
  return Array.isArray(room.privateFor) ? 2 : NICK_COLOR_COUNT;
}

export function claimNickColor(
  seated: readonly { nickColor?: number }[],
  capacity: number,
): number {
  const taken = new Set<number>();
  for (const member of seated) {
    if (
      typeof member.nickColor === "number" &&
      member.nickColor >= 0 &&
      member.nickColor < capacity
    ) {
      taken.add(member.nickColor);
    }
  }
  for (let tone = 0; tone < capacity; tone += 1) {
    if (!taken.has(tone)) return tone;
  }
  return 0;
}

export function seatMember(
  identity: TavernIdentity,
  now: string,
  seated: readonly TavernMember[],
  capacity: number,
): TavernMember {
  return {
    id: identity.id,
    name: identity.name,
    joinedAt: now,
    lastSeen: now,
    nickColor: claimNickColor(seated, capacity),
  };
}

export function paintMembers(
  members: Array<Omit<TavernMember, "nickColor"> & { nickColor?: number }>,
  capacity: number,
): TavernMember[] {
  const order = [...members].sort((left, right) => {
    const time = left.joinedAt.localeCompare(right.joinedAt);
    return time !== 0 ? time : left.id.localeCompare(right.id);
  });
  const taken = new Set<number>();
  const painted = new Map<string, TavernMember>();
  for (const member of order) {
    const kept =
      typeof member.nickColor === "number" &&
      member.nickColor >= 0 &&
      member.nickColor < capacity &&
      !taken.has(member.nickColor)
        ? member.nickColor
        : claimNickColor(
            [...taken].map((nickColor) => ({ nickColor })),
            capacity,
          );
    taken.add(kept);
    painted.set(member.id, { ...member, nickColor: kept });
  }
  return members.map((member) => painted.get(member.id)!);
}

export function nickColorClass(tone: number | undefined): string {
  if (typeof tone !== "number") return "text-ink-soft";
  return NICK_COLOR_CLASSES[tone] ?? "text-ink-soft";
}

export function nickColorOf(room: TavernRoom, authorId: string): number | undefined {
  return room.members.find((member) => member.id === authorId)?.nickColor;
}
