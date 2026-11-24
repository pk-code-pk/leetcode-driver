# JobsU handoff (as of 2026-11-24)

## What it is

A two-sided marketplace: residents in Newton, Brookline and Brighton post small jobs; .edu-confirmed Boston College
students apply, get booked and get paid; staff moderate. Built for Ben, the founder of JobsU, who already runs his
own live app at app.jobsu.app. This repo's version is a rebuild that includes everything his app does plus more.

## Where it lives

- Live: https://jobsu.vercel.app (Vercel project `jobsu`, team `pks-projects-a170111b`, root dir `jobsu`).
  Deploy from the repo root: `vercel deploy --prod --yes`. The build runs `drizzle-kit push --force` then `next build`.
  It no longer seeds demo data.
- Database: Neon Postgres (env vars on Vercel). Direct port 5432 is blocked from the cloud container; query it through
  Neon's HTTPS endpoint (`POST https://<host>/sql` with the `Neon-Connection-String` header), using values from
  `vercel env pull`.
- Live accounts right now: only the user's own `praneel@bc.edu` (student). No staff account exists.
- Local: Postgres 16 (`service postgresql start`), dev DB `jobsu_dev`, test DB `jobsu_test`. `npm run dev` (port 3100),
  `npm run seed` for sample data (logins use `password123`), `npm run remove-demo` to delete sample accounts.
- Tests: `npm test` (23 unit), `PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium npm run test:e2e -- --trace off`
  (12 browser tests; two can time out in a full run while the dev server compiles, and pass on their own).

## Stack and layout

Next.js 15 App Router, React 19, TypeScript, Tailwind v4, Drizzle ORM + postgres.js, lucide-react, Vitest, Playwright.
Business rules in `src/lib/config.ts` (10% fee, $18.75 minimum rate, 7-day auto-release). Booking logic in
`src/lib/bookings.ts` (`syncJobStatus` handles jobs that need several students) and `src/lib/jobFlow.ts`.
Payments are simulated (`PAYMENTS_PROVIDER=mock`); Stripe Connect code exists in `src/lib/payments.ts` but has never
run against real Stripe.

## Done recently

- Removed demo data from the live site; deploys no longer seed.
- Built every feature from Ben's screen recordings: several students per job, profile photos (stored in the `photos`
  table), pay guide per category, getting-there options, six new categories, side-by-side applicant review with
  Decline (status `passed`, which stays closed even if a place reopens), repost and "hire again", direct contact after
  a paid job, resident home details, student For you / All jobs feed with applied counts, first-application profile
  basics plus an optional profile card, profile completeness, referral links (`/r/<code>`).

## Blocked on the user

1. Email: Resend account plus DNS for jobsu.app. Until then `DEV_SHOW_CODES=true` shows sign-up codes on screen, so
   anyone can sign up as any @bc.edu address. Do not share the link widely before this is fixed.
2. Which email should be staff (`ADMIN_EMAILS` on Vercel).
3. Payments: Venmo/cash paid directly first (needs an off-switch for in-app payments) or Stripe (about a week).
4. Vercel Pro ($20/month, required for commercial use) and pointing jobsu.app at Vercel.
5. Ben: decide whether this is a rebuild on this codebase or work on his existing app.

## Code still to do (no user input needed)

Safer database migrations instead of `push --force`, rate limits on login and sign-up, a Vercel cron for
`/api/cron/auto-release` (needs `CRON_SECRET`), error tracking. Optionally swap custom auth for Better Auth.
Vercel has been emailing "Preview deployment failed" for leetcode-driver previews; production is fine, not yet looked into.

## The quote for Ben

Draft doc: https://claude.ai/artifact/MQv1kJRYtfE3YzdD8oCJYt ("JobsU Platform Quote", not sent).
Two options: $2,500 full launch (includes moving his existing users and 60 days of fixes) or $2,000 platform only
(30 days of fixes); 50% deposit, 50% at launch; he owns the code once paid; he pays running costs; $40/hour or
$300/month after. The user felt it was low and worried about pricing features Ben already has.
Advice given: ask Ben first whether he wants a rebuild or work on his app; sell what's new (the redesign he praised,
speed, staff/dispute/auto-release features, safe user migration, an ongoing developer) instead of per-feature prices;
add a monthly retainer ($400–500/month) rather than raising the upfront number. Next step offered: rewrite the doc
around that once Ben answers. Ben's messages so far: he liked the demo ("The UI looks very clean"), sent recordings
of his current app, and said he'd draw up what he thinks is needed and discuss pricing. He hasn't sent the list yet.
