import { numberFromEnv } from "@/shared/utils/env";

export interface PackMate {
  id: string;
  name: string;
  addedAt: string;
}

export const MAX_PACK = numberFromEnv(process.env.NEXT_PUBLIC_MAX_PACK, 20);
