import { NextResponse } from "next/server";
import * as tavernController from "@/controllers/tavern.controller";
import { withTavern } from "../_lib/api";

// The tavern, now truly cross-machine: the same listRooms the browser ran
// against localStorage runs here against the shared tables, private tables
// invisible to third ids included.
export async function GET(request: Request) {
  return withTavern(request, async (state, _body, context) => {
    return NextResponse.json({
      ok: true,
      message: "",
      data: {
        identity: context.identity,
        rooms: tavernController.listRooms(state, context.identity),
      },
    });
  });
}
