# Validation record

Validated on 3 November 2026 in the Windows workspace with Node 24, Next.js 16.4.4, and a real local Supabase Docker stack. No production services were used.

## Completed checks

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: 10 Vitest unit tests and 19 PostgreSQL integration checks passed.
- `npm run build`: passed with the supported webpack builder. Turbopack encountered a Windows sandbox process-launch failure, so build/dev explicitly select webpack.
- Core Playwright suite: 7 passed; 1 intentionally skipped because it checks the _unconfigured_ setup state and this workspace now has Supabase configured.
- Additional real-Supabase media test: passed private upload, actual image decoding from a signed URL, creator and brand detail pages, recorded external redirect, and rejection of a cross-origin upload request.
- Dedicated visual acceptance test: passed at 1440px and 360px. Screenshots are saved under `docs/screenshots`. Total browser checks across the three test files: 9 passed, with the one environment-specific setup check skipped.
- Desktop and 360px layout traversal covered creator, brand, admin, marketplace, and saved routes. The discovered analytics overflow was corrected and the responsive traversal subsequently passed.
- Production dependency audit: zero known vulnerabilities at the time checked. The full dependency audit reports 16 moderate development-tooling advisories, rooted in transitive `minimatch` versions used by ESLint packages. The suggested automatic fix would downgrade lint packages to incompatible historical releases, so it was not applied blindly. Recheck upstream toolchain releases before launch.

## Tested security behavior

Invitation expiration, revocation, one-time acceptance, uninvited Auth creation denial, deferred GoTrue metadata handling, direct Auth signup denial, current account-state checks, immediate access loss for an existing suspended session, restoration, creator ownership, brand organization ownership, direct REST role-escalation attempts, verification protection, brand self-approval denial, pending-listing visibility, unique private saved records, immutable audit records, restricted admin invitations, honest manual metrics/earnings, service-only rate limiting, and billing default-off behavior.

## Verification boundaries

- Supabase RLS and Auth were tested locally with actual services, not only mocked client responses.
- PGlite tests additionally exercise migrations and adversarial SQL; its Auth/Storage schema scaffold is intentionally narrower than the real provider.
- Local upload tests used a tiny generated PNG fixture; no creator media was transmitted to an unrelated service.
- External application tests verify the recorded event and HTTPS redirect response without submitting an application to the external site.
- Resend delivery, production SMTP/recovery delivery, Stripe checkout/portal/webhook behavior against a real Stripe account, and Sentry ingestion require external credentials and remain unverified.
- TikTok, Instagram, YouTube OAuth/API synchronization and SideShift API access are unavailable by design. Manual workflows work and are labeled.
- No Vercel deployment or custom domain has been provisioned. Deployment preparation and operator instructions are included.

The local Supabase services and fictional data remain available for development. Playwright-owned web servers stop automatically after each test run. Use `npm run dev` to open the portal again. The local account password is in the ignored `.env.local` file; development login names are listed in the README.
