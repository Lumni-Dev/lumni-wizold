import { NextResponse } from "next/server";
import { GAME_VERSION } from "@/shared/constants/version";

// Rendered once at build and served from the CDN: the version never changes
// inside a deployment, and polling it used to invoke a function every minute
// per open tab.
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ version: GAME_VERSION });
}
