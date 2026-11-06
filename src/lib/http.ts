import "server-only";
import type { NextRequest } from "next/server";
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected = new URL(
    process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin,
  ).origin;
  return origin === expected;
}
