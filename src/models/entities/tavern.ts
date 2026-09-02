import { SOCIAL } from "@/shared/config/social";

export const MAX_ROOM_MEMBERS = SOCIAL.roomMembers;
export const MAX_ROOM_MESSAGES = SOCIAL.roomMessages;
export const ROOM_NAME_MAX_LENGTH = SOCIAL.roomNameMaxLength;
export const MESSAGE_MAX_LENGTH = SOCIAL.messageMaxLength;
export const MESSAGE_COOLDOWN_MS = SOCIAL.messageCooldownMs;
export const MEMBER_TIMEOUT_MS = SOCIAL.memberTimeoutMs;
export const OPEN_ROOM_MIN_LEVEL = SOCIAL.openRoomMinLevel;

export interface TavernIdentity {
  id: string;
  name: string;
  level?: number;
}
export interface TavernMember extends TavernIdentity {
  joinedAt: string;
  lastSeen: string;
  nickColor: number;
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
  if (clean.length < SOCIAL.roomNameMinLength) {
    return "O nome da mesa precisa de pelo menos " + SOCIAL.roomNameMinLength + " letras.";
  }
  if (clean.length > ROOM_NAME_MAX_LENGTH) {
    return "O nome da mesa pode ter no máximo " + ROOM_NAME_MAX_LENGTH + " letras.";
  }
  if (!/^[\p{L}\p{M}\p{N}]+$/u.test(clean)) {
    return "Só letras e números no nome da mesa, sem espaço nem sinais.";
  }
  return null;
}
