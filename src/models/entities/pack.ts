import { numberFromEnv } from "@/shared/utils/env";

export interface PackMate {
  id: string;
  name: string;
  addedAt: string;
}

// A pending invite this hunter received: who sent it and when. Accepting makes
// the two companions; declining drops the row.
export interface PackInvite {
  id: string;
  fromId: string;
  fromName: string;
  createdAt: string;
}

export const MAX_PACK = numberFromEnv(process.env.NEXT_PUBLIC_MAX_PACK, 20);
