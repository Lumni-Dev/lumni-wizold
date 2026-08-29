import { NextResponse } from "next/server";
import { serverMoon } from "../_lib/moon";

export async function POST() {
  const moon = await serverMoon();
  return NextResponse.json({
    phase: moon.phase.key,
    age: moon.age,
    illumination: moon.illumination,
    waxing: moon.waxing,
    source: moon.source,
  });
}
