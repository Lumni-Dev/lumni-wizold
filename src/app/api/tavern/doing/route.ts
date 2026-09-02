import { NextResponse } from "next/server";
import { listVisibleDoing } from "@/models/repositories/server/presence.store";
import { withIdentity } from "../../_lib/api";

export async function GET(request: Request) {
  return withIdentity(request, async (identity, client) => {
    const people = await listVisibleDoing(client, identity.id);
    return NextResponse.json({ ok: true, message: "", data: { people } });
  });
}
