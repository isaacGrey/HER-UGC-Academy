import { ownedBrand } from "@/lib/auth";
import { rows, record } from "@/lib/data";
import { PageHeading, Badge, currency } from "./ui";
export async function Billing() {
  const { brandId } = await ownedBrand();
  const [flag, plans, subscriptions] = await Promise.all([
    record("feature_flags", "brand_billing_enabled"),
    rows("plans", { active: "true" }),
    rows("subscriptions", { brand_id: brandId }),
  ]);
  const subscription = subscriptions[0];
  return (
    <>
      <PageHeading
        eyebrow="BRAND MEMBERSHIP"
        title="Room to grow, together."
        description="Your academy access and future subscription options, in one place."
      />
      <section className="card stack" style={{ marginBottom: 24 }}>
        <h2>
          {flag?.enabled ? "Your membership" : "You’re part of the community."}
        </h2>
        <Badge tone="green">
          {flag?.enabled
            ? String(subscription?.status || "FREE")
            : "BILLING DISABLED · FREE ACCESS"}
        </Badge>
        <p>
          {flag?.enabled
            ? "Choose an active plan below. Checkout is securely handled by Stripe."
            : "Invited brands currently join at no charge. No checkout or payment details are required."}
        </p>
        {flag?.enabled && subscription?.stripe_customer_id && (
          <form method="POST" action="/api/billing/portal">
            <button className="button secondary">Manage subscription</button>
          </form>
        )}
      </section>
      <div className="grid">
        {plans.map((plan) => (
          <section key={plan.id} className="card stack">
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <h2>
              {currency(plan.price_monthly, String(plan.currency))}
              <small> / month</small>
            </h2>
            <ul>
              {Array.isArray(plan.features) &&
                plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            {flag?.enabled && plan.stripe_price_monthly_id && (
              <form method="POST" action="/api/billing/checkout">
                <input type="hidden" name="planId" value={plan.id} />
                <button className="button">Choose plan</button>
              </form>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
