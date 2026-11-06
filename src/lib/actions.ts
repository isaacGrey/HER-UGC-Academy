"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, ownedBrand } from "./auth";
import { db, serviceDb } from "./supabase/server";
import { hashToken, newToken, validInvitation } from "./security";
import {
  schemas,
  type EditableTable,
  loginSchema,
  invitationSchema,
  passwordSchema,
} from "./schemas";
import { entities } from "./entities";
import { homeFor } from "./constants";
import type { ActionResult } from "./types";
import { sendEmail, reportError } from "./integrations";

const ok = (message: string): ActionResult => ({ ok: true, message });
const fail = (
  message = "We could not save that change. Check your inputs and try again.",
): ActionResult => ({ ok: false, message });
const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
async function rate(key: string, maximum = 10) {
  const { data, error } = await serviceDb().rpc("consume_rate_limit", {
    key: hashToken(key),
    maximum,
    seconds: 900,
  });
  return !error && data === true;
}
export async function authAction(
  kind: string,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  if (kind === "login") {
    const parsed = loginSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return fail("Enter a valid email and password.");
    if (!(await rate(`login:${parsed.data.email}`, 20)))
      return fail("Please wait before trying again.");
    const client = await db();
    const { data, error } = await client.auth.signInWithPassword(parsed.data);
    if (error || !data.user)
      return fail("Email or password is incorrect, or access is unavailable.");
    const { data: profile } = await client
      .from("profiles")
      .select("role,status")
      .eq("id", data.user.id)
      .single();
    if (!profile || profile.status !== "ACTIVE") {
      await client.auth.signOut();
      return fail("Your account does not currently have portal access.");
    }
    redirect(homeFor(profile.role));
  }
  if (kind === "forgot") {
    const email = z.email().safeParse(form.get("email"));
    if (!email.success) return fail("Enter a valid email.");
    if (await rate(`reset:${email.data.toLowerCase()}`, 5)) {
      const client = await db();
      await client.auth.resetPasswordForEmail(email.data, {
        redirectTo: `${appUrl()}/auth/callback?next=/reset-password`,
      });
    }
    return ok("If this account is eligible, a reset email is on its way.");
  }
  if (kind === "reset") {
    const password = passwordSchema.safeParse(form.get("password"));
    if (!password.success) return fail("Use at least 12 characters.");
    const { client } = await requireUser();
    const { error } = await client.auth.updateUser({ password: password.data });
    if (error)
      return fail("The reset link may have expired. Request a new one.");
    await client.auth.signOut();
    redirect("/login?reset=success");
  }
  if (kind === "invite") {
    const token = z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .safeParse(form.get("token"));
    const password = passwordSchema.safeParse(form.get("password"));
    const name = z
      .string()
      .trim()
      .min(2)
      .max(100)
      .safeParse(form.get("display_name"));
    if (!token.success || !password.success || !name.success)
      return fail("Enter your name and a password of at least 12 characters.");
    if (!(await rate(`invite:${token.data}`, 5)))
      return fail("Please wait before trying again.");
    const client = serviceDb();
    const hash = hashToken(token.data);
    const { data: invite } = await client
      .from("invitations")
      .select("email,accepted_at,revoked_at,expires_at")
      .eq("token_hash", hash)
      .maybeSingle();
    if (!invite || !validInvitation(invite))
      return fail("This invitation is expired, revoked, or already used.");
    const { error } = await client.auth.admin.createUser({
      email: invite.email,
      password: password.data,
      email_confirm: true,
      app_metadata: { invitation_hash: hash },
      user_metadata: { display_name: name.data },
    });
    if (error) {
      await reportError(error, "claim_invitation");
      return fail(
        "This invitation could not be accepted. Contact the academy for help.",
      );
    }
    redirect("/login?invited=success");
  }
  return fail();
}
export async function logout() {
  const client = await db();
  await client.auth.signOut();
  redirect("/login");
}

async function authorizeEntity(table: EditableTable, id?: string) {
  const ctx = await requireUser();
  if (ctx.profile.role === "ADMIN") return ctx;
  if (table === "plans") throw new Error("Forbidden");
  if (table === "brands" || table === "opportunities") {
    if (ctx.profile.role !== "BRAND") throw new Error("Forbidden");
    const brand = await ownedBrand();
    if (table === "brands" && id !== brand.brandId)
      throw new Error("Forbidden");
    if (table === "opportunities" && id) {
      const { data } = await ctx.client
        .from(table)
        .select("brand_id,status")
        .eq("id", id)
        .single();
      if (
        !data ||
        data.brand_id !== brand.brandId ||
        !["DRAFT", "REJECTED"].includes(data.status)
      )
        throw new Error("Forbidden");
    }
    return { ...ctx, brandId: brand.brandId };
  }
  if (ctx.profile.role !== "CREATOR") throw new Error("Forbidden");
  if (table === "creator_profiles" && id !== ctx.profile.id)
    throw new Error("Forbidden");
  if (id && table !== "creator_profiles") {
    if (table === "social_metric_snapshots")
      throw new Error("Snapshots are append-only in this interface");
    const { data } = await ctx.client
      .from(table)
      .select("creator_id")
      .eq("id", id)
      .single();
    if (!data || data.creator_id !== ctx.profile.id)
      throw new Error("Forbidden");
  }
  return ctx;
}
export async function saveEntity(
  table: string,
  id: string | undefined,
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  if (!(table in schemas)) return fail();
  try {
    const key = table as EditableTable;
    const ctx = await authorizeEntity(key, id);
    const config = entities[key];
    const raw: Record<string, unknown> = {};
    for (const field of config.fields)
      raw[field.name] =
        field.type === "checkbox"
          ? form.get(field.name) === "on"
          : field.type === "multi"
            ? field.options
              ? form.getAll(field.name)
              : String(form.get(field.name) || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
            : String(form.get(field.name) || "");
    const parsed = schemas[key].safeParse(raw);
    if (!parsed.success)
      return {
        ok: false,
        message: "Please check the highlighted fields.",
        fields: parsed.error.issues.reduce<Record<string, string[]>>(
          (acc, issue) => {
            const key = String(issue.path[0]);
            (acc[key] ??= []).push(issue.message);
            return acc;
          },
          {},
        ),
      };
    const values: Record<string, unknown> = { ...parsed.data };
    if (config.owner === "creator_id" && !id)
      values.creator_id = ctx.profile.id;
    if (config.owner === "brand_id" && !id) {
      if (!("brandId" in ctx))
        return fail("Create listings from a brand account.");
      values.brand_id = ctx.brandId;
    }
    if (key === "social_metric_snapshots" && ctx.profile.role !== "ADMIN") {
      const { data } = await ctx.client
        .from("social_accounts")
        .select("id")
        .eq("id", values.social_account_id)
        .eq("creator_id", ctx.profile.id)
        .single();
      if (!data) return fail("Select one of your social accounts.");
    }
    if (key === "creator_earnings") {
      const { data } = await ctx.client
        .from("feature_flags")
        .select("enabled")
        .eq("id", "creator_earnings_enabled")
        .single();
      if (!data?.enabled)
        return fail("The earnings journal is currently disabled.");
    }
    const query = id
      ? ctx.client.from(key).update(values).eq("id", id)
      : ctx.client.from(key).insert(values);
    const { error, data } = await query.select("id").single();
    if (error || !data) {
      await reportError(error, "save_" + key);
      return fail(
        error?.code === "23505"
          ? "This record already exists. Edit the existing entry instead."
          : undefined,
      );
    }
    revalidatePath("/", "layout");
    return ok(`${config.singular} saved.`);
  } catch (error) {
    await reportError(error, "save_entity");
    return fail(
      "You do not have permission to make that change, or the service is unavailable.",
    );
  }
}
export async function deleteEntity(
  table: string,
  id: string,
): Promise<ActionResult> {
  if (
    ![
      "portfolio_items",
      "social_accounts",
      "creator_campaigns",
      "creator_earnings",
    ].includes(table)
  )
    return fail();
  try {
    const { client } = await authorizeEntity(table as EditableTable, id);
    const { data, error } = await client
      .from(table)
      .delete()
      .eq("id", id)
      .select("id")
      .single();
    if (error || !data) return fail();
    revalidatePath("/", "layout");
    return ok("Record deleted.");
  } catch {
    return fail("You do not have permission to delete this record.");
  }
}
export async function toggleSave(
  kind: "opportunity" | "creator" | "brand",
  id: string,
): Promise<ActionResult> {
  const { client, profile } = await requireUser(
    kind === "creator" ? ["BRAND"] : ["CREATOR"],
  );
  if (!z.uuid().safeParse(id).success) return fail();
  const target = {
    opportunity: "opportunities",
    creator: "creator_profiles",
    brand: "brands",
  }[kind];
  const { data: visible } = await client
    .from(target)
    .select("id")
    .eq("id", id)
    .single();
  if (!visible) return fail("This item is unavailable.");
  const table = {
    opportunity: "saved_opportunities",
    creator: "saved_creators",
    brand: "saved_brands",
  }[kind];
  const column = `${kind}_id`;
  const { data: existing } = await client
    .from(table)
    .select("id")
    .eq("user_id", profile.id)
    .eq(column, id)
    .maybeSingle();
  const { error } = existing
    ? await client.from(table).delete().eq("id", existing.id)
    : await client.from(table).insert({ user_id: profile.id, [column]: id });
  if (error) return fail();
  await client.from("analytics_events").insert({
    user_id: profile.id,
    event: `${kind.toUpperCase()}_${existing ? "UNSAVED" : "SAVED"}`,
    entity_id: id,
  });
  revalidatePath("/", "layout");
  return ok(existing ? "Removed from saved." : "Saved to your collection.");
}
export async function moderate(
  entity: string,
  id: string,
  action: string,
  reason = "",
): Promise<ActionResult> {
  const { client, profile } = await requireUser(["ADMIN"]);
  if (!z.uuid().safeParse(id).success) return fail();
  let changes: Record<string, unknown> = {};
  if (
    entity === "profiles" &&
    ["ACTIVE", "SUSPENDED", "REVOKED", "DELETED"].includes(action)
  ) {
    if (id === profile.id)
      return fail("You cannot change your own account state.");
    changes = { status: action };
  } else if (
    ["creator_profiles", "brands"].includes(entity) &&
    ["verify", "unverify"].includes(action)
  )
    changes = { verified: action === "verify" };
  else if (
    entity === "opportunities" &&
    ["LIVE", "REJECTED", "CLOSED", "DRAFT", "feature", "unfeature"].includes(
      action,
    )
  ) {
    changes =
      action === "feature" || action === "unfeature"
        ? { featured: action === "feature" }
        : {
            status: action,
            ...(action === "LIVE"
              ? {
                  approved_at: new Date().toISOString(),
                  rejection_reason: null,
                }
              : {}),
            ...(action === "REJECTED"
              ? { rejection_reason: reason.slice(0, 2000) }
              : {}),
            ...(action === "CLOSED"
              ? { closed_at: new Date().toISOString() }
              : {}),
          };
  } else return fail();
  if (entity === "opportunities" && action === "feature") {
    const { data: listing } = await client
      .from("opportunities")
      .select("status")
      .eq("id", id)
      .single();
    if (listing?.status !== "LIVE")
      return fail("Approve this opportunity before featuring it.");
  }
  const { error, data } = await client
    .from(entity)
    .update(changes)
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) return fail();
  if (process.env.RESEND_API_KEY) {
    let recipient: string | undefined;
    let subject = "Your Her Opportunity Portal account";
    let message = `Your account access is now ${action.toLowerCase()}. Contact the academy if you need help.`;
    if (entity === "profiles") {
      const { data: target } = await client
        .from("profiles")
        .select("email")
        .eq("id", id)
        .single();
      recipient = target?.email;
    }
    if (
      entity === "opportunities" &&
      ["LIVE", "REJECTED", "CLOSED"].includes(action)
    ) {
      const { data: listing } = await client
        .from("opportunities")
        .select("brand_id,title")
        .eq("id", id)
        .single();
      if (listing) {
        const { data: contact } = await client
          .from("brand_contacts")
          .select("contact_email")
          .eq("id", listing.brand_id)
          .single();
        recipient = contact?.contact_email;
        subject = "Your HER opportunity review";
        message = `${listing.title}\nStatus: ${action}\n${action === "REJECTED" ? reason : ""}\nView your listings: ${appUrl()}/brand/opportunities`;
      }
    }
    if (recipient) {
      const delivery = await sendEmail(recipient, subject, message);
      if (!delivery.sent) {
        revalidatePath("/", "layout");
        return ok(`Change saved and audited. ${delivery.reason}`);
      }
    }
  }
  revalidatePath("/", "layout");
  return ok("Change saved and recorded in the audit log.");
}
export async function submitOpportunity(id: string): Promise<ActionResult> {
  const ctx = await authorizeEntity("opportunities", id);
  const { data, error } = await ctx.client
    .from("opportunities")
    .update({ status: "PENDING" })
    .eq("id", id)
    .select("id")
    .single();
  if (error || !data) return fail();
  revalidatePath("/", "layout");
  return ok("Submitted for academy review.");
}
export async function inviteMember(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, profile } = await requireUser(["ADMIN"]);
  const parsed = invitationSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail("Enter a valid email and role.");
  if (parsed.data.role === "ADMIN" && !profile.can_invite_admin)
    return fail("Only privileged admins can invite administrators.");
  if (!(await rate(`admin-invite:${profile.id}`, 30)))
    return fail("Invitation limit reached. Please try again later.");
  const { token, hash } = newToken();
  const { error } = await client
    .from("invitations")
    .insert({ ...parsed.data, token_hash: hash, invited_by: profile.id });
  if (error) return fail();
  const url = `${appUrl()}/invite/${token}`;
  const result = await sendEmail(
    parsed.data.email,
    "Your invitation to Her Opportunity Portal",
    `You are invited to join Her Opportunity Portal. Choose your password here: ${url}\nThis single-use link expires in 7 days.`,
  );
  revalidatePath("/admin/invitations");
  return {
    ok: true,
    message: result.sent
      ? "Invitation sent."
      : `Invitation created. ${result.reason}`,
    url: process.env.NODE_ENV !== "production" ? url : undefined,
  };
}
export async function invitationAction(
  id: string,
  action: "resend" | "revoke",
): Promise<ActionResult> {
  const { client } = await requireUser(["ADMIN"]);
  const { data: inv } = await client
    .from("invitations")
    .select("id,email,accepted_at,revoked_at")
    .eq("id", id)
    .single();
  if (!inv || inv.accepted_at)
    return fail("Accepted invitations cannot be changed.");
  if (action === "revoke") {
    const { error } = await client
      .from("invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return fail();
    revalidatePath("/admin/invitations");
    return ok("Invitation revoked.");
  }
  if (inv.revoked_at)
    return fail("Create a new invitation for a revoked invite.");
  const { token, hash } = newToken();
  const { error } = await client
    .from("invitations")
    .update({
      token_hash: hash,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    })
    .eq("id", id)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .select("id")
    .single();
  if (error) return fail();
  const url = `${appUrl()}/invite/${token}`;
  const result = await sendEmail(
    inv.email,
    "Your new HER invitation",
    `Accept your invitation: ${url}\nThis replaces your previous invitation link and expires in 7 days.`,
  );
  revalidatePath("/admin/invitations");
  return {
    ok: true,
    message: result.sent ? "New invitation sent." : result.reason,
    url: process.env.NODE_ENV !== "production" ? url : undefined,
  };
}
export async function setFlag(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  const { client } = await requireUser(["ADMIN"]);
  if (!["brand_billing_enabled", "creator_earnings_enabled"].includes(id))
    return fail();
  if (id === "brand_billing_enabled" && enabled) {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)
      return fail(
        "Configure Stripe credentials and webhook before enabling billing.",
      );
    const { data } = await client
      .from("plans")
      .select("id")
      .eq("active", true)
      .not("stripe_price_monthly_id", "is", null)
      .limit(1);
    if (!data?.length) return fail("Configure an active paid plan first.");
  }
  const { error } = await client
    .from("feature_flags")
    .update({ enabled })
    .eq("id", id);
  if (error) return fail();
  revalidatePath("/", "layout");
  return ok("Setting updated.");
}
export async function saveContact(
  kind: "creator" | "brand",
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const { client, profile } = await requireUser(
    kind === "creator" ? ["CREATOR"] : ["BRAND"],
  );
  const email = z.email().safeParse(form.get("contact_email"));
  if (!email.success) return fail("Enter a valid contact email.");
  const id = kind === "creator" ? profile.id : (await ownedBrand()).brandId;
  const values: Record<string, string> =
    kind === "creator"
      ? { id, contact_email: email.data, preferred_contact_method: "Email" }
      : {
          id,
          contact_email: email.data,
          contact_name: String(form.get("contact_name") || "").slice(0, 100),
          contact_title: String(form.get("contact_title") || "").slice(0, 100),
        };
  const { error } = await client
    .from(kind === "creator" ? "creator_contacts" : "brand_contacts")
    .upsert(values);
  if (error) return fail();
  revalidatePath("/", "layout");
  return ok("Contact details saved.");
}
