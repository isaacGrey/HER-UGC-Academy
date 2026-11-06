import { NextResponse, type NextRequest } from "next/server";
import { ownedBrand } from "@/lib/auth";
import { serviceDb } from "@/lib/supabase/server";
import { stripe } from "@/lib/billing";
import { sameOrigin } from "@/lib/http";
import { reportError } from "@/lib/integrations";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { client, profile, brandId } = await ownedBrand();
  const { data: flag } = await client
    .from("feature_flags")
    .select("enabled")
    .eq("id", "brand_billing_enabled")
    .single();
  if (!flag?.enabled)
    return NextResponse.json({ error: "Billing is disabled" }, { status: 409 });
  try {
    const provider = stripe();
    const { action } = await params;
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const { data: subscription } = await client
      .from("subscriptions")
      .select("*")
      .eq("brand_id", brandId)
      .single();
    if (action === "portal") {
      if (!subscription?.stripe_customer_id)
        return NextResponse.json(
          { error: "No subscription customer" },
          { status: 409 },
        );
      const session = await provider.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${origin}/brand/billing`,
      });
      return NextResponse.redirect(session.url, 303);
    }
    if (action !== "checkout")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const form = await request.formData();
    const { data: plan } = await client
      .from("plans")
      .select("id,stripe_price_monthly_id")
      .eq("id", String(form.get("planId")))
      .eq("active", true)
      .single();
    if (!plan?.stripe_price_monthly_id)
      return NextResponse.json({ error: "Plan unavailable" }, { status: 400 });
    if (["active", "trialing"].includes(subscription?.status))
      return NextResponse.json(
        {
          error:
            "Manage your existing subscription through the customer portal.",
        },
        { status: 409 },
      );
    let customer = subscription?.stripe_customer_id;
    if (!customer) {
      const created = await provider.customers.create(
        { email: profile.email, metadata: { brand_id: brandId } },
        { idempotencyKey: `brand-customer-${brandId}` },
      );
      customer = created.id;
      const { error } = await serviceDb()
        .from("subscriptions")
        .upsert(
          { brand_id: brandId, stripe_customer_id: customer },
          { onConflict: "brand_id" },
        );
      if (error) throw error;
    }
    const session = await provider.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price: plan.stripe_price_monthly_id, quantity: 1 }],
      metadata: { brand_id: brandId, plan_id: plan.id },
      subscription_data: { metadata: { brand_id: brandId, plan_id: plan.id } },
      success_url: `${origin}/brand/billing?checkout=success`,
      cancel_url: `${origin}/brand/billing`,
    });
    if (!session.url) throw new Error("Checkout missing");
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    await reportError(error, "billing");
    return NextResponse.json(
      { error: "Billing is temporarily unavailable." },
      { status: 503 },
    );
  }
}
