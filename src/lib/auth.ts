import "server-only";
import { redirect } from "next/navigation";
import { db, configured } from "./supabase/server";
import type { Profile } from "./types";
import type { Role } from "./constants";
export async function requireUser(allowed?: readonly Role[]) {
  if (!configured()) redirect("/setup");
  const client = await db();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await client
    .from("profiles")
    .select("id,email,display_name,role,status,can_invite_admin")
    .eq("id", user.id)
    .single();
  if (error || !data || data.status !== "ACTIVE") redirect("/access-denied");
  const profile = data as Profile;
  if (allowed && !allowed.includes(profile.role)) redirect("/access-denied");
  return { client, profile };
}
export async function ownedBrand() {
  const ctx = await requireUser(["BRAND"]);
  const { data, error } = await ctx.client
    .from("brand_members")
    .select("brand_id")
    .eq("user_id", ctx.profile.id)
    .limit(1)
    .single();
  if (error || !data) throw new Error("Brand membership unavailable");
  return { ...ctx, brandId: data.brand_id as string };
}
