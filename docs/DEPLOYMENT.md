# Vercel + Supabase deployment

1. Create a dedicated production Supabase project and retain its database password in your secret manager. Link this checkout with `npx supabase link --project-ref <ref>`. Run `npx supabase db push` and inspect the migration result. Never run the fictional seed against this project.
2. In Supabase Auth, disable new public signups, anonymous sign-ins, and unused providers. Keep email/password login enabled. The database invitation trigger adds an independent gate, but provider configuration must also match the product policy.
3. Set the Supabase site URL to the final HTTPS portal domain. Allow exactly `https://<domain>/auth/callback` as a redirect, plus a separate preview domain only if needed. Do not use broad production wildcards. Configure a production SMTP sender for recovery email; test delivery and expiration.
4. Import the repository into Vercel as a Next.js project. Use Node 22 or newer, `npm ci`, and `npm run build`. The lockfile is required. Set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` separately for production and preview. All preview deployments must use a non-production database.
5. Configure `RESEND_API_KEY` and `EMAIL_FROM` with a verified domain for invitations. Keep billing disabled unless Stripe test-mode validation has passed. Social API credentials are not used by the manual adapters; do not add unused secrets.
6. Run `npm run bootstrap:admin` from a trusted operator environment pointing at production, using a unique admin password. Remove the bootstrap credentials immediately. It refuses to create another admin when an active one exists.
7. Attach your domain, such as `portal.herugcacademy.com`, in Vercel. Follow the DNS records Vercel supplies. Confirm HTTPS, the final app URL, and Auth callbacks all agree. No domain is hardcoded in source.
8. Run lint, typecheck, unit/database tests, and the production build. Run browser tests against a disposable staging environment. Test real invitation and reset delivery using addresses you control before inviting members.

## Required launch checks

- Public signup fails at both the UI and Supabase Auth API.
- A valid invitation creates exactly one account; expired/revoked/reused tokens fail.
- Creators cannot edit another profile or view another creator's private contact details.
- Brands cannot edit another organization or publish their own opportunity.
- Suspension blocks the member's already-open session on the next protected request; restoration works.
- Non-live listings are hidden from marketplace discovery; external click records are written before redirect.
- Uploaded images use private buckets and signed URLs; arbitrary file types and oversized files are rejected.
- Invitation and recovery emails deliver and resolve to the production callback/domain.
- No seed accounts, seed passwords, `.env.local`, local status files, or service keys are in the source repository.
- Review provider limits, backup retention, and database monitoring for your expected audience.

## Optional Stripe setup

Create recurring prices in Stripe. Store monthly/yearly price IDs on plans. Configure the customer portal and webhook endpoint at `/api/stripe/webhook`, subscribing to `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Verify duplicate and out-of-order events in Stripe test mode. Only then enable billing. Checkout availability is implemented; additional feature entitlements must be specified before selling restricted access.

## Operational behavior

The app checks account status from PostgreSQL on every protected request. Signed media URLs can remain usable until their short expiration; already-downloaded data cannot be recalled. Auth provider accounts are retained on soft deletion so audit and application records remain intact. Permanent deletion and retention automation are operator responsibilities.

Audit records are immutable to application users; restrict database-owner access separately. Review and purge old `rate_limits` and analytics records according to your retention policy. Never forward full request bodies, passwords, invitation tokens, or Auth tokens to error monitoring.

The baseline CSP blocks objects, framing, and unapproved connection origins. Next.js inline scripts require the current `unsafe-inline` allowance; move to per-request nonces if your deployment requires a stricter CSP. The application does not embed third-party video frames; portfolio links open safely in a separate tab.

## Rollback

Use Vercel's previous deployment for application rollback. Database changes must be forward-compatible with the previous app version; write a corrective migration instead of deleting migration history. Take a database backup before destructive schema work. Do not run `supabase db reset` on production.
