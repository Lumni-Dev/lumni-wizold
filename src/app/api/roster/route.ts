import { NextResponse } from "next/server";
import { cachedHunters } from "../_lib/roster-cache";
import { withSessionRead } from "../_lib/api";

export async function GET(request: Request) {
  return withSessionRead(request, async (client) => {
    const hunters = await cachedHunters(client);
    return NextResponse.json({
      ok: true,
      message: "",
      data: { hunters },
    });
  });
}
