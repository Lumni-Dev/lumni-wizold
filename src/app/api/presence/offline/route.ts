import { NextResponse } from "next/server";
import { clearPresence } from "@/models/repositories/server/presence.store";
import { withIdentity } from "../../_lib/api";

export async function POST(request: Request) {
  return withIdentity(request, async (identity, client) => {
    await clearPresence(client, identity.id);
    return NextResponse.json({ ok: true, message: "", data: null });
  });
}
