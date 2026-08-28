import { NextResponse } from "next/server";
import { heartbeat } from "@/models/repositories/server/tavern.store";
import { withIdentity } from "../../../../_lib/api";

// The seat's pulse, carrying the current name so a paid rename is spoken at
// every table. The lightest lane there is: identity, one row update, done.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withIdentity(request, async (identity, client) => {
    await heartbeat(client, id.slice(0, 80), identity.id, identity.name);
    return NextResponse.json({ ok: true, message: "", data: null });
  });
}
