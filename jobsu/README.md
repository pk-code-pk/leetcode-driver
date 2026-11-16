# JobsU

The JobsU platform: families in Newton, Brookline and Brighton post small jobs, and
.edu-confirmed Boston College students apply, get booked, do the work and get paid.

## What it does

**Residents**
- Sign up, confirm their email, and post a job with type-specific questions, date, hours and rate
  ("Not sure" sends the job to staff for a suggested rate).
- See applicants (first name and last initial until booked), message them, and book one.
- Confirm the job is done to release payment, or pause payment and ask for help.
- Rate the student afterwards.

**Students**
- Sign up with a .edu address from a live campus (others join a waitlist) and confirm it with a code.
- Build a profile, browse and filter open jobs, and apply in one click.
- Mark a booked job done with the hours worked; get paid minus the 10% service fee.
- Rate the family afterwards.

**Staff** (`/admin`)
- Review jobs that need a rate or mention work JobsU doesn't allow; approve or decline.
- Recommend applicants, handle reported problems and payment disputes, pause accounts.
- See flagged messages and every email the system has sent.

**Rules built in** (from the Terms of Service)
- $18.75/hour minimum rate.
- Payment is held at booking and released when the resident confirms, or automatically
  7 days after the job date unless a problem has been raised.
- 10% platform fee, taken from the student's payout.
- Phone numbers and emails in messages are hidden until a pair has booked; mentions of
  paying off-platform are flagged for staff.
- Ratings are double-blind: neither side sees the other's until both are in (or 14 days pass).
- Everyone confirms they are 18+ and accepts the Terms at sign-up.

## Run it locally

Requires Node 20+ and PostgreSQL.

```bash
cd jobsu
npm install
cp .env.example .env        # then edit DATABASE_URL if needed
npm run db:push             # create the tables
npm run seed                # optional: sample people and jobs
npm run dev                 # http://localhost:3100
```

Seeded logins (password `password123`): `admin@jobsu.app`, `sarah@example.com` (resident),
`jake@bc.edu`, `maya@bc.edu`, `chris@bc.edu` (students).

With `DEV_SHOW_CODES=true`, email confirmation codes are shown on screen so you don't need
a real inbox. Turn that off in production.

## Settings (`.env`)

| Setting | What it does |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `APP_URL` | Public address of the site, used in emails and payment redirects |
| `STUDENT_EMAIL_DOMAINS` | Comma-separated campuses that can sign up, e.g. `bc.edu` |
| `ADMIN_EMAILS` | Emails that become staff accounts when they sign up |
| `RESEND_API_KEY`, `EMAIL_FROM` | Send real email through Resend. Without a key, emails are only recorded at `/admin/outbox` |
| `PAYMENTS_PROVIDER` | `mock` (simulated holds and payouts) or `stripe` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Needed when `PAYMENTS_PROVIDER=stripe` |
| `CRON_SECRET` | Protects the auto-release endpoint |
| `DEV_SHOW_CODES` | Show confirmation codes on screen (development only) |

## Going live

1. **Database**: point `DATABASE_URL` at a hosted Postgres and run `npm run db:push`.
2. **Email**: set `RESEND_API_KEY` and `EMAIL_FROM`, and set `DEV_SHOW_CODES=false`.
3. **Payments**: set `PAYMENTS_PROVIDER=stripe` with your Stripe keys, enable Stripe Connect
   (Express accounts), and add a webhook to `/api/stripe/webhook` for
   `checkout.session.completed` and `account.updated`.
   - The Stripe code path has not been run against a real Stripe account yet. Test it in
     Stripe's test mode before taking real payments.
   - Card holds expire after about 7 days, so jobs booked far in advance will need the hold
     placed closer to the job date. That scheduling is not built yet.
4. **Auto-release**: call `GET /api/cron/auto-release` once a day with the header
   `Authorization: Bearer $CRON_SECRET` (or run `npm run auto-release`).
5. **Staff**: put your email in `ADMIN_EMAILS` and sign up; that account opens `/admin`.

`npm run build && npm start` runs the production server.

## Tests

```bash
npm test            # business rules: fees, minimum rate, .edu check, message screening, auto-release
npm run typecheck
npm run test:e2e    # full flows in a real browser, against a separate jobsu_test database
```

The browser tests need a Postgres database at `postgres://jobsu:jobsu@localhost:5432/jobsu_test`
(or set `TEST_DATABASE_URL`) and Playwright's Chromium (`npx playwright install chromium`, or set
`PLAYWRIGHT_CHROMIUM` to an existing Chromium binary).

## Where things are

- `src/lib/config.ts` — rates, fee, towns, auto-release window.
- `src/lib/jobTypes.ts` — job categories, their questions, and the prohibited-work check.
- `src/lib/payments.ts` — the payment provider (mock and Stripe).
- `src/lib/bookings.ts`, `src/lib/jobFlow.ts` — releasing payment, confirming bookings.
- `src/lib/screening.ts` — message screening.
- `src/app/actions/` — everything a person can do (sign up, post, apply, book, pay, rate, report).
- `src/app/globals.css`, `src/components/ui.tsx`, `src/components/motion.tsx` — the design system.

## Not built yet

- Recurring jobs as repeating bookings (a recurring job is currently booked once).
- Jobs needing more than one student.
- The matchmaker and Direct Contact fees from the pre-launch Terms.
- Photo uploads for profiles.
- Tax forms (1099-NEC).
- A block button (reports go to staff, as on the current site).
