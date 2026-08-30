import { numberFromEnv } from "@/shared/utils/env";

export const MAX_ROOM_MEMBERS = numberFromEnv(process.env.NEXT_PUBLIC_MAX_ROOM_MEMBERS, 20);
export const MAX_ROOM_MESSAGES = 40;
const ROOM_NAME_MIN_LENGTH = 3;
export const ROOM_NAME_MAX_LENGTH = 25;
export const MESSAGE_MAX_LENGTH = 150;
export const MESSAGE_COOLDOWN_MS = numberFromEnv(
  process.env.NEXT_PUBLIC_MESSAGE_COOLDOWN_MS,
  10000,
);
export const MEMBER_TIMEOUT_MS = 150000;
// A room with no password is a public square: creating one and stepping into one
// both ask for OPEN_ROOM_MIN_LEVEL. A room with a password takes any level, as
// long as the person carries the password.
export const OPEN_ROOM_MIN_LEVEL = 50;
export interface TavernIdentity {
  id: string;
  name: string;
  // Only the acting identity (built by tavernIdentity from the character row)
  // carries a level; identities derived from room members leave it undefined,
  // and the open-room gate reads `level ?? 1`.
  level?: number;
}
export interface TavernMember extends TavernIdentity {
  joinedAt: string;
  lastSeen: string;
}
export interface TavernMessage {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  at: string;
}
export interface TavernRoom {
  id: string;
  name: string;
  password: string | null;
  ownerId: string;
  createdAt: string;
  members: TavernMember[];
  messages: TavernMessage[];
  privateFor?: string[];
}
export function isPrivateTable(room: TavernRoom): boolean {
  return Array.isArray(room.privateFor);
}
export interface TavernState {
  version: number;
  rooms: TavernRoom[];
}
export const TAVERN_VERSION = 1;
export function emptyTavern(): TavernState {
  return { version: TAVERN_VERSION, rooms: [] };
}
export interface TavernResult {
  ok: boolean;
  message: string;
  state: TavernState;
  roomId?: string;
}
export function isRoomFull(room: TavernRoom): boolean {
  return room.members.length >= MAX_ROOM_MEMBERS;
}
export function validateRoomName(name: string): string | null {
  const clean = name.trim();
  if (clean.length < ROOM_NAME_MIN_LENGTH) {
    return "O nome da mesa precisa de pelo menos " + ROOM_NAME_MIN_LENGTH + " letras.";
  }
  if (clean.length > ROOM_NAME_MAX_LENGTH) {
    return "O nome da mesa pode ter no máximo " + ROOM_NAME_MAX_LENGTH + " letras.";
  }
  if (!/^[\p{L}\p{M}\p{N}]+$/u.test(clean)) {
    return "Só letras e números no nome da mesa, sem espaço nem sinais.";
  }
  return null;
}
