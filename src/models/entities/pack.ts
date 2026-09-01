import { LIMITS } from "@/shared/config/limits";

export interface PackMate {
  id: string;
  name: string;
  addedAt: string;
}

export interface PackInvite {
  id: string;
  fromId: string;
  fromName: string;
  createdAt: string;
}

export const MAX_PACK = LIMITS.pack;
