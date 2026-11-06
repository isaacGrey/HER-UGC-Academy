# Her Opportunity Portal

An invitation-only marketplace for Her UGC Academy creators, vetted brands, and academy administrators. Campaign applications, fulfillment, contracts, and payouts stay on external platforms. This application is a modular Next.js monolith backed by Supabase Auth, PostgreSQL RLS, and private Supabase Storage.

The complete visual authority is [docs/HER-Design.md](docs/HER-Design.md). It is preserved unchanged. Global tokens and shared components implement its light gray canvas, white rounded cards, purple actions, Inter typography, pill badges, circular creator avatars, top navigation for discovery, and sidebar workspaces with mobile navigation drawers.

## Stack

Next.js 16 App Router, React 19, strict TypeScript, Tailwind 4, Lucide, Zod, Supabase SSR, Stripe SDK, Vitest, Playwright. Versions are pinned by `package-lock.json`. Native semantic controls are styled with the HER design system; there is no uncustomized shadcn theme. Server Components are the default. Client code is limited to forms, confirmation dialogs, saving, and uploads.

## Getting started

Prerequisites: Node 22 or newer, npm, Docker Desktop for local Supabase, and the Supabase CLI (or `npx supabase`).

```sh
npm ci
npx supabase start
cp .env.example .env.local
npx supabase status
```

Copy the **local** API URL, anonymous JWT key, and service-role JWT key into `.env.local`. Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Never commit `.env.local`, and never place the service key in a `NEXT_PUBLIC_` variable. Supabase CLI applies the migrations automatically on first startup.

For an already running local database:

```sh
npx supabase migration up --local
```

Create the first administrator by setting `BOOTSTRAP_ADMIN_EMAIL` and a unique `BOOTSTRAP_ADMIN_PASSWORD` (at least 12 characters), then run:

```sh
npm run bootstrap:admin
npm run dev
```

The bootstrap script refuses to run when an active admin already exists. It uses the same invitation-gated Auth creation path and grants this first admin permission to invite other admins. Remove bootstrap password variables afterward. Subsequent accounts must use admin invitations.

The application shows `/setup` if the database is not configured. There is no demo auth bypass. A normal public `/signup` route does not exist, and the database rejects Auth users without a valid invitation even if signup is accidentally enabled in the Auth service.

In this prepared Windows workspace, local Supabase is already configured and seeded. If `npm` is not on your shell PATH, start the app directly with `node node_modules/next/dist/bin/next dev --webpack`. Open `http://localhost:3000`. Use a login listed below and the `SEED_PASSWORD` from your ignored `.env.local`.

## Fictional development data

Set a fresh `SEED_PASSWORD` in `.env.local`, then run `npm run seed`. It creates one admin, ten creators, five brands, ten opportunities, manual metric history, portfolio link examples, and saved relationships. Names, briefs, and records are fictional. Links to `example.com` are explicitly development fixtures, not working campaigns. The script is repeatable and refuses a remote URL unless `ALLOW_DEVELOPMENT_SEED=true` is set. Never set this override on a production project.

| Role     | Development login                                          |
| -------- | ---------------------------------------------------------- |
| Admin    | `admin@demo.her.test`                                      |
| Creators | `creator1@demo.her.test` through `creator10@demo.her.test` |
| Brands   | `brand1@demo.her.test` through `brand5@demo.her.test`      |

All use the locally generated or operator-supplied `SEED_PASSWORD`; there is no committed password. E2E tests create additional clearly identified development accounts and briefs. Local Auth email is captured by Mailpit at the URL printed by `supabase status`.

## Product areas

Creators can edit their own profile and contact details; upload a photo and portfolio images; manage portfolio links; add TikTok, Instagram, and YouTube profiles; append self-reported analytics snapshots; track current campaigns and earnings; discover and save opportunities and brands; and apply through recorded external links.

Brands can edit their company profile and contacts; discover/filter/save creators; create and edit drafts; submit briefs for review; see rejection feedback; and access future Stripe subscription flows when billing is enabled.

Administrators can invite/resend/revoke invitations, review listings, approve and publish, reject/close/feature listings, verify profiles, edit profiles, suspend/revoke/restore/soft-delete account access, manage plan pricing and feature flags, and inspect audit records. Only bootstrap-authorized admins can invite another admin. Multi-user brand membership is modeled separately from companies; self-service membership administration is not exposed in this release.

Discovery filters persist in the URL and queries are paginated. Creator performance filtering uses a security-invoker database view built from the latest snapshot of each social account. Cross-platform audiences may overlap; aggregate metrics are labeled self reported. Contact information is stored separately from discoverable profiles.

## Database and authorization

Migrations are the authoritative schema. Generated types are in `src/lib/database.types.ts`.

```sh
npx supabase gen types typescript --local > src/lib/database.types.ts
```

- Every user-accessible table has RLS. Requests use the user's Supabase session; the service role is reserved for invitation claim, sensitive rate limits, Stripe reconciliation, bootstrap, and development seeds.
- Server guards re-read the profile's current status on every request/mutation. RLS also checks it independently, so suspension takes effect for existing access tokens.
- Invitation tokens have 256 bits of entropy, a seven-day default expiration, SHA-256 storage, revocation, and single-use enforcement.
- A deferred Auth constraint trigger checks trusted app metadata at transaction commit, after GoTrue has written it. It locks and consumes the invitation and creates application records in the same transaction. Concurrent claims cannot both succeed.
- Security-definer functions pin their search path. Protected-column triggers prevent self-verification, role escalation, and brand self-approval.
- Audit records are written by database triggers. Authenticated users, including admins, cannot update/delete audit records. A database superuser remains capable of administrative changes.
- Storage buckets are private, have a five-megabyte limit, and accept JPG/PNG/WebP only. Upload handlers check extension, content type, magic bytes, current ownership, and origin. URLs are short-lived and signed.
- HTTP mutations check Origin. Server Actions use Next.js origin protections. Outbound links require HTTPS, and the callback rejects external redirect destinations.
- Rate limits are stored in PostgreSQL, not process memory. Login is limited per email; invitation claims per token; reset and invitation creation have separate limits. Configure provider/WAF protection for network-wide abuse before a large launch.

## Email and integrations

Set `RESEND_API_KEY` and a verified `EMAIL_FROM` to deliver portal invitations. Supabase Auth sends password recovery messages; configure its SMTP provider separately in production. Development invitation URLs are returned once to the admin UI. Resending rotates the token; the old URL stops working. Production does not expose raw invitation URLs. Email delivery failures are explicitly reported.

| Integration       | Works now                                                          | External requirements                                                         |
| ----------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| TikTok            | Manual profile links and self-reported history                     | API adapter implementation, credentials, OAuth review                         |
| Instagram         | Manual profile links and self-reported history                     | Professional-account API adapter, credentials, provider review                |
| YouTube           | Manual profile links, history, platform revenue journal            | OAuth/Analytics adapter and appropriate approved scopes                       |
| SideShift         | HTTPS application links, manual campaign records                   | No API integration is claimed                                                 |
| Stripe            | Checkout, customer portal, signed webhook handling; off by default | Secret key, webhook secret, prices, configured portal, test-mode verification |
| Resend            | Transactional email adapter                                        | Verified sending domain and API key                                           |
| Sentry            | Sanitized structured errors and optional envelope transport        | Optional `SENTRY_DSN`; no sensitive request bodies are forwarded              |
| Product analytics | Server-recorded marketplace events in PostgreSQL                   | External analytics export can be added without changing event names           |

Social API adapters deliberately report unavailable. There are no fabricated API responses, synchronized badges, or OAuth buttons that pretend to work. Manual earnings distinguish YouTube platform revenue from SideShift, brand-direct, and other campaign earnings. No payouts occur here.

## Billing

`brand_billing_enabled` defaults to false. No Stripe credentials or checkout are needed for invited brands. Administrators can configure plans and Stripe price IDs. Enabling billing through the UI requires credentials and at least one active monthly Stripe price. The brand billing page offers hosted checkout and the customer portal. Webhooks verify the raw request signature, map the subscription to its brand, and deduplicate event IDs. Subscription entitlements beyond checkout availability are intentionally not used to restrict marketplace features in this initial release; define that policy before enabling paid access.

## Commands and validation

```sh
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
npm run test:e2e
npm run format
```

The build/dev scripts use Next.js's supported webpack builder because the Windows sandbox's process launcher failed with Turbopack. This does not change the runtime or deployment target.

`npm run test` runs unit tests plus PostgreSQL integration tests using PGlite. The latter execute all migrations and directly attempt forbidden operations. Auth and Storage schema scaffolding in that harness is not a replacement for real Supabase tests.

Playwright loads `.env.local`. With a seeded local Supabase stack, it tests invitation acceptance/expiry/revocation, login, profile editing, saves, brand draft submission, admin approval, live-session suspension/restoration, direct REST authorization attacks, and navigation/responsiveness. Without Supabase configuration, connected tests are explicitly skipped and only public/setup behavior runs. Install a browser with `npx playwright install chromium` if needed. `PLAYWRIGHT_CHANNEL` can select an installed browser. See [docs/VALIDATION.md](docs/VALIDATION.md) for the actual run results.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel + Supabase setup, Auth configuration, migrations, storage, email, callback URLs, launch checks, and rollback. No production service or domain is provisioned automatically by the local setup scripts.

## Project map

- `src/app`: App Router pages, protected route dispatcher, route handlers, loading/error states.
- `src/components`: HER design primitives, reusable shells/forms, discovery, details, dashboards, administration.
- `src/lib`: validation, permissions, entities, server services, Supabase clients, provider boundaries.
- `supabase/migrations`: schema, constraints, RLS, Auth hooks, private buckets, discovery views.
- `scripts`: safe bootstrap, repeatable fictional seed, PostgreSQL security tests.
- `tests`: unit and browser flow coverage.

Remaining provider dependencies and deliberately limited functionality are documented above rather than represented as working integrations. Do not interpret a successful local build as verification of production email, Stripe transactions, social OAuth, or a production deployment.
