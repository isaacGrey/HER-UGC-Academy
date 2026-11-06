import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { secureUrl } from "@/lib/schemas";
import { sameOrigin } from "@/lib/http";
async function openApplication(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (request.method === "POST" && !sameOrigin(request))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { client, profile } = await requireUser(["CREATOR"]);
  const { id } = await params;
  const { data } = await client
    .from("opportunities")
    .select("id,external_url")
    .eq("id", id)
    .eq("status", "LIVE")
    .single();
  const parsed = secureUrl.safeParse(data?.external_url);
  if (!data || !parsed.success)
    return NextResponse.json(
      { error: "Opportunity unavailable" },
      { status: 404 },
    );
  const { error } = await client.from("analytics_events").insert({
    user_id: profile.id,
    event: "EXTERNAL_APPLICATION_CLICKED",
    entity_id: id,
  });
  if (error)
    return NextResponse.json(
      { error: "Unable to open application. Please retry." },
      { status: 503 },
    );
  const response = NextResponse.redirect(parsed.data, 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
// A normal anchor avoids browser form-action restrictions on external redirects.
// This endpoint only records navigation analytics; campaign applications stay external.
export const GET = openApplication;
export const POST = openApplication;
