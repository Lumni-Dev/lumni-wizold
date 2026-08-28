import { NextResponse } from "next/server";
import { heartbeat } from "@/models/repositories/server/tavern.store";
import { withTavern } from "../../../../_lib/api";

// The seat's pulse, carrying the current name so a paid rename is spoken at
// every table. A direct row update: no diff to compute.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withTavern(request, async (_state, _body, context) => {
    await heartbeat(context.client, id.slice(0, 80), context.identity.id, context.identity.name);
    return NextResponse.json({ ok: true, message: "", data: null });
  });
}
