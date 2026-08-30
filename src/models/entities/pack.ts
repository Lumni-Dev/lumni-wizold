import { numberFromEnv } from "@/shared/utils/env";

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

export const MAX_PACK = numberFromEnv(process.env.NEXT_PUBLIC_MAX_PACK, 20);
