import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/security";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  if (code) {
    const client = await db();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          safeReturnPath(request.nextUrl.searchParams.get("next")),
          origin,
        ),
      );
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
