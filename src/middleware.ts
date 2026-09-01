import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { corsHeaders, originAllowed } from "@/app/api/_lib/cors";

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    if (!originAllowed(request)) {
      return new NextResponse(null, { status: 403 });
    }
    return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
