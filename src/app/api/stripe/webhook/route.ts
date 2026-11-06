import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/billing";
import { serviceDb } from "@/lib/supabase/server";
import { reportError } from "@/lib/integrations";
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") || "",
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const client = serviceDb();
  const { data: existing } = await client
    .from("webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ received: true });
  try {
    if (
      [
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
      ].includes(event.type)
    ) {
      const sent = event.data.object as Stripe.Subscription;
      // Retrieve authoritative current state to tolerate out-of-order webhook deliveries.
      const subscription =
        event.type === "customer.subscription.deleted"
          ? sent
          : await stripe().subscriptions.retrieve(sent.id);
      const brandId = subscription.metadata.brand_id;
      if (!brandId)
        return NextResponse.json({ error: "Missing mapping" }, { status: 400 });
      const period = subscription.items.data[0]?.current_period_end;
      const { error } = await client
        .from("subscriptions")
        .update({
          stripe_subscription_id: subscription.id,
          stripe_customer_id:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer.id,
          plan_id: subscription.metadata.plan_id || null,
          status: subscription.status,
          current_period_end: period
            ? new Date(period * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("brand_id", brandId);
      if (error) throw error;
    }
    const { error } = await client
      .from("webhook_events")
      .insert({ id: event.id });
    if (error && error.code !== "23505") throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    await reportError(error, "stripe_webhook");
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
