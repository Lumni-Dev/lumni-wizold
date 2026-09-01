import { NextResponse } from "next/server";
import { listPackPresence } from "@/models/repositories/server/presence.store";
import { withIdentity } from "../../_lib/api";

export async function GET(request: Request) {
  return withIdentity(request, async (identity, client) => {
    const mates = await listPackPresence(client, identity.id);
    return NextResponse.json({ ok: true, message: "", data: { mates } });
  });
}
