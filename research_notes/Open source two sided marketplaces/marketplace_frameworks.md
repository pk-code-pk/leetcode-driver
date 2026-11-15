# Open-Source General-Purpose Marketplace Frameworks, Booking Platforms and Starter Kits (as base for a TaskRabbit-style student-gig marketplace)

Methodology note: The GitHub REST API (api.github.com) and `gh` were blocked in this research session (HTTP 403, "GitHub access to this repository is not enabled for this session"). Repo metrics come from scraping GitHub HTML pages with WebFetch on 2026-11-15. The scrapes returned stars, forks and commit counts, but **not** last-commit dates, contributor counts or language byte breakdowns. Those fields are marked UNVERIFIED or listed as gaps. Star counts are rounded as GitHub displays them.

## Which frameworks give the best two-sided base (two user types with profiles, booking, messaging, reviews, payouts)?

### Takeaway
Sharetribe's Web Template is the only candidate found that ships every TaskRabbit-shaped primitive out of the box: provider/customer users, listings, search, hourly calendar booking, transaction messaging, two-way reviews and Stripe payouts. Its catch is that it is only a frontend and needs Sharetribe's paid hosted backend. Among fully self-hostable code, the multi-vendor commerce engines (Spree 5's built-in marketplace, Mercur on Medusa) supply seller onboarding, order splitting, commissions and Stripe Connect payouts. They are product/order-oriented, though, and lack booking, messaging and two-way reviews as confirmed features. No maintained, fully self-hostable open-source "service marketplace with booking + messaging + reviews + Connect payouts" was found.

### Cited Findings

**Sharetribe Web Template (frontend for the Sharetribe Developer Platform, formerly "Flex")**
- Repo: https://github.com/sharetribe/web-template. Apache-2.0 license, 11,467 commits on main, 280 forks. The scrape showed 69 stars, which is suspiciously low against 280 forks and may be a scrape artifact (UNVERIFIED). — [GitHub](https://github.com/sharetribe/web-template)
- Built on create-react-app with added server-side rendering and code-splitting. Ships with CircleCI config and a Heroku deploy guide. Needs "mandatory env vars" (Sharetribe client credentials) to run. — [GitHub](https://github.com/sharetribe/web-template)
- Features: calendar bookings with hourly availability up to a year ahead, priced as booked time × price. A product mode drops the calendar and sells by unit count. Built-in customer↔provider messaging. Both parties review after a transaction, and reviews stay hidden until both submit or the review window expires. Payments run through Stripe, which handles payouts. — [Sharetribe features / service marketplace pages via search](https://www.sharetribe.com/service-marketplace); [Sharetribe operator features](https://sharetribe.com/docs/operator-guides/features)
- Only a secondary source says payouts use Stripe Connect specifically. Sharetribe's own pages in this search said only "Stripe". — [search summary of Sharetribe pages](https://www.sharetribe.com/features/marketplace-essentials)

**Spree Commerce (Rails, v5 era)**
- Repo: https://github.com/spree/spree. 15.8k stars, 5.3k forks, 30,872 commits, 96 open issues, 116 open PRs, BSD-3-Clause. — [GitHub](https://github.com/spree/spree)
- The marketplace is in the open-source core: seller onboarding with requirement checklists, per-seller order splitting, a commission engine, a payout ledger with Stripe Connect, and a Seller Panel, all "ship in this repository under the BSD 3-Clause license". — [GitHub](https://github.com/spree/spree)
- Stack: Ruby/Rails backend gem shipped as a Docker image. Storefront in Next.js 16, React 19, Tailwind 4 and TypeScript. Admin built with Vite, TanStack and shadcn/ui. Requires Node 24+, pnpm and Turborepo. Integrates Stripe, Adyen, PayPal and MeiliSearch. — [GitHub](https://github.com/spree/spree)
- The paid Enterprise Edition adds Shopify/WooCommerce seller sync, advanced marketplace reporting, multi-tenant SaaS, B2B workflows, audit logging and SLA support. — [GitHub](https://github.com/spree/spree)

**Mercur (multi-vendor marketplace on Medusa)**
- Repo: https://github.com/mercurjs/mercur. 1.9k stars, 487 forks, 1,121 commits, 15 open issues, 8 open PRs, MIT ("Mercur core"). Pitched as "A Mirakl alternative". — [GitHub](https://github.com/mercurjs/mercur)
- Provides a seller panel at `/seller` (products, orders, payouts), an admin console at `/dashboard` (vendors, catalog, commissions, rules), a buyer storefront, and a Stripe Connect payout provider. Optional Resend email and Algolia/Meilisearch search. — [GitHub](https://github.com/mercurjs/mercur); [mercurjs.com](https://www.mercurjs.com/)
- Stack: TypeScript, Node 20+, Medusa, React/Vite, PostgreSQL 13+, Redis, Bun and Turbo. Has `e2e-tests` and `integration-tests` directories plus Playwright tooling. — [GitHub](https://github.com/mercurjs/mercur)
- The commercial "Mercur Enterprise" tier adds "payments, compliance, trust, integrations and support" plus financial control and settlement. The open-source tier is described as "the complete standalone marketplace engine". Reviews, messaging and booking are not listed on the homepage or README. — [mercurjs.com](https://www.mercurjs.com/)

**Medusa (headless commerce framework)**
- Repo: https://github.com/medusajs/medusa. 37.3k stars, 5.5k forks, 11,336 commits on develop, 84 open issues, 32 open PRs. MIT core, with RBAC Enterprise Edition materials under a separate commercial license (ENTERPRISE-LICENSE.md). — [GitHub](https://github.com/medusajs/medusa)
- No out-of-the-box marketplace. Medusa's marketplace recipe has you build a custom vendor module, vendor admin actor types, vendor↔product/order module links, vendor API routes, and order splitting (one order per vendor via a replicated cart-complete workflow). Payouts are not covered. Examples include a Vendors guide and a Restaurant-Delivery guide. — [Medusa marketplace recipe](https://docs.medusajs.com/resources/recipes/marketplace)

**Saleor (Python/Django GraphQL commerce)**
- Repo: https://github.com/saleor/saleor. 23.6k stars, 6.2k forks, 22,717 commits, BSD-3-Clause, production line 3.x. Storefront (Next.js) and dashboard live in separate repos. — [GitHub](https://github.com/saleor/saleor)
- No multi-vendor/marketplace support is advertised. "Multichannel" means per-channel pricing, stock and so on, not independent sellers. — [GitHub](https://github.com/saleor/saleor)

**Bagisto (Laravel + Vue)**
- Repo: https://github.com/bagisto/bagisto. 28.4k stars, 3.4k forks, MIT ("will always remain free under the MIT License"). Tests use Pest and Playwright. — [GitHub](https://github.com/bagisto/bagisto)
- Multi-vendor marketplace is marketed via a separate product page and an extension marketplace. The README does not say whether it is free. My background knowledge says it is a paid extension (UNVERIFIED). — [GitHub](https://github.com/bagisto/bagisto)

**Cal.com / Cal.diy (scheduling)**
- In April 2026 Cal.com moved its production codebase to a private repo. The public code is now `calcom/cal.diy`, relicensed from AGPL-3.0 to **MIT**. Teams, Organizations, Insights, Workflows and SSO/SAML were removed. — [Cal.com blog](https://cal.com/pt-BR/blog/cal-diy-open-source-to-closed-source); [AlternativeTo](https://alternativeto.net/news/2026/4/cal-com-is-going-closed-source-with-a-major-shift-in-its-license-strategy/); [FOSS Force](https://fossforce.com/2026/04/ai-pushes-cal-com-to-shutter-open-and-go-nonfree/)
- The calcom/cal.com URL now resolves to Cal.diy: 50.1k stars, 15.6k forks, 16,517 commits. Stack is Next.js, tRPC, React, Tailwind, Prisma, PostgreSQL, Turborepo and Zod. Tests use Playwright E2E and Vitest. The README says Cal.diy "is strictly recommended for personal, non-production use". — [GitHub](https://github.com/calcom/cal.com)
- Cal.com cited AI-driven vulnerability discovery as its reason. Sources disagree on how stripped Cal.diy is. Cal.com says it keeps the full scheduling engine, app store framework and booking infrastructure. — [The New Stack](https://thenewstack.io/cal.com-codebase-security-ai/); [implicator.ai](https://www.implicator.ai/cal-com-goes-private-as-self-hosted-calendly-choices-narrow-in-2026/)
- The Cal.com Platform Starter Kit (experts marketplace on Supabase/Tailwind/Prisma, 273 stars) was **archived on 2025-03-31** and is "no longer maintained". — [GitHub](https://github.com/calcom/platform-starter-kit)

**Sharetribe Go (legacy Rails)**
- Repo: https://github.com/sharetribe/sharetribe. 2.5k stars, 1.3k forks, 19,572 commits. Its README says "Sharetribe Go is no longer actively maintained" and points users to "The New Sharetribe". — [GitHub](https://github.com/sharetribe/sharetribe)
- Stack per README: Ruby 3.4.8, Rails 8.1.2, MySQL 8.4, React + jQuery, Sphinx search, delayed_job, Devise, S3, and RSpec/Cucumber tests. Payments via Stripe (PayPal only on sharetribe.com-hosted). The recent Rails version suggests dependency bumps continue despite the no-longer-maintained notice. — [GitHub](https://github.com/sharetribe/sharetribe)

**Cocorico (Symfony)**
- Repo: https://github.com/Cocolabs-SAS/cocorico. 874 stars, 589 forks, only 329 commits, MIT. Topics: PHP, Symfony, MongoDB, service marketplace, sharing economy. Uses Travis CI (an older setup), PHPUnit and Behat. — [GitHub](https://github.com/Cocolabs-SAS/cocorico)
- "Cocorico has evolved into Second," a commercial successor at scnd.com, which signals the OSS repo is effectively legacy. Booking, messaging, reviews and MangoPay are not confirmed by the scrape. — [GitHub](https://github.com/Cocolabs-SAS/cocorico)

**Next.js / Supabase boilerplates**
- A search found no single open-source repo covering booking + reviews + messaging + Stripe Connect on Next.js/Supabase. Results were mostly agency tutorials and freelancer listings. Small repos such as `dilshod-ui` (Stripe Connect + Supabase) cover only payments. — [awesome.ecosyste.ms entry](https://awesome.ecosyste.ms/projects/github.com%2Frofiyev%2Fdilshod-ui); [RapidDev guide (paid agency, not OSS)](https://www.rapidevelopers.com/md/how-to-build-v0/marketplace)

### Inferences
- **Fastest to a working TaskRabbit-like MVP:** the Sharetribe Web Template. Its booking, messaging, reviews and payouts transaction model maps almost 1:1 to tasker↔client gigs. Adaptation is mostly config, UI, listing fields and a custom transaction process. The cost is vendor lock-in and a monthly fee (see next question).
- **Best fully-owned base:** Spree 5, if Rails is acceptable. It has BSD licensing, marketplace and Stripe Connect payouts in core, and a modern Next.js storefront. Mercur is the TypeScript equivalent. Either would still need booking/scheduling, messaging and two-way reviews added, and a "product + cart" model reshaped into "task request → quote/accept → schedule → complete → release payout". That is likely substantial work (estimated weeks to months; not sourced).
- **Cal.diy as a component:** it can supply the scheduling engine (availability, booking pages, calendar sync) under MIT. Its own non-production warning and the April 2026 fork-off make it risky as a core dependency. It provides no marketplace, payouts or reviews.
- Saleor and bare Medusa are weaker starting points than Spree or Mercur, because marketplace logic must be built from scratch.

### Gaps
- Last-commit dates, contributor counts and language byte breakdowns for every repo (GitHub API blocked; HTML scrape omitted them).
- Whether Mercur's open-source tier includes reviews or buyer↔seller messaging. Its docs and features pages were not fetched.
- Whether Bagisto's multi-vendor and booking modules are free or paid.
- Airbnb-style rental clones were not evaluated. No credible, maintained repo surfaced within the tool budget.
- The Sharetribe Web Template's true star count (scrape said 69).

## Which require a paid backend or have restrictive licenses (AGPL, source-available) that matter for a commercial startup?

### Takeaway
The Sharetribe Web Template is Apache-2.0, but it is useless without Sharetribe's hosted, proprietary backend: $39/month for test mode only, and $199/month billed yearly (or $259 billed monthly) to go live, plus usage credits. Sharetribe Go is source-available rather than open source. Cal.com's AGPL is gone: Cal.diy is now MIT, but the real product is closed. Spree, Saleor, Medusa core, Mercur core, Bagisto and Cocorico are permissive (MIT/BSD/Apache), each with paid enterprise add-ons.

### Cited Findings
- Sharetribe plans: **Build** at $39/month gives full code access and full API access in Test mode, with test payments only. **Live** at $199/month billed yearly ($259 monthly) allows real transactions with no Sharetribe transaction fee. **Hold** is $49/month. Each paid plan includes 1M usage credits per month, with overage billed at volume rates. Sharetribe hosts the backend, database and business logic, and you host only the frontend (Render at $19/month is suggested). No self-hosted backend is offered. — [Sharetribe pricing](https://www.sharetribe.com/pricing/)
- Sharetribe Go is under the "Sharetribe Community Public License", described as source-available. — [GitHub](https://github.com/sharetribe/sharetribe)
- Cal.diy moved from AGPL-3.0 to MIT, while Cal.com's hosted, Teams and Enterprise code went closed. — [AlternativeTo](https://alternativeto.net/news/2026/4/cal-com-is-going-closed-source-with-a-major-shift-in-its-license-strategy/); [Cal.com blog](https://cal.com/pt-BR/blog/cal-diy-open-source-to-closed-source)
- Medusa: MIT core, with Enterprise Edition (RBAC) materials requiring a commercial agreement. — [GitHub](https://github.com/medusajs/medusa)
- Mercur: MIT core, with Enterprise (payments, compliance, trust, settlement) licensed commercially. It markets "zero GMV fees". — [mercurjs.com](https://www.mercurjs.com/)
- Spree: BSD-3-Clause core including the marketplace. The Enterprise Edition is paid. — [GitHub](https://github.com/spree/spree)
- Saleor is BSD-3-Clause. Bagisto and Cocorico are MIT. — [Saleor](https://github.com/saleor/saleor); [Bagisto](https://github.com/bagisto/bagisto); [Cocorico](https://github.com/Cocolabs-SAS/cocorico)

### Inferences
- For a bootstrapped student startup, Sharetribe's roughly $2.4k/year minimum live cost is a real but modest fee. The bigger concern is lock-in: business logic and data live on Sharetribe's servers, and custom backend behaviour is limited to what its transaction-process and API model allow.
- No candidate reviewed imposes AGPL copyleft today. The main license risk is the "open-core" pattern (Medusa, Mercur, Spree): features a marketplace might later want, such as advanced settlement or compliance, may sit in paid tiers.

### Gaps
- Whether Mercur's MIT tier's Stripe Connect payout provider is production-complete, given that the homepage lists "payments" under Enterprise. The README and homepage appear to conflict, so verify in docs.
- Sharetribe usage-credit pricing per unit.

## What is the maintenance/activity status of each?

### Takeaway
Actively developed: Spree (v5, Next.js 16 storefront), Medusa, Mercur, Saleor, Bagisto, the Sharetribe Web Template (11k+ commits, backed by a company) and Cal.diy (newly forked April 2026). Legacy or abandoned: Sharetribe Go (officially unmaintained), Cocorico (superseded by commercial "Second") and the Cal.com Platform Starter Kit (archived March 2025).

### Cited Findings
- Sharetribe Go: "no longer actively maintained". 2 open issues and 1 open PR. — [GitHub](https://github.com/sharetribe/sharetribe)
- Cocorico "has evolved into Second" (commercial). Only 329 commits, with Travis CI. — [GitHub](https://github.com/Cocolabs-SAS/cocorico)
- Cal.com Platform Starter Kit archived on 2025-03-31. — [GitHub](https://github.com/calcom/platform-starter-kit)
- Cal.diy is MIT, positioned for personal, non-production self-hosting. Commercial development continues privately. — [GitHub](https://github.com/calcom/cal.com); [implicator.ai](https://www.implicator.ai/cal-com-goes-private-as-self-hosted-calendly-choices-narrow-in-2026/)
- Activity proxies from open work: Spree has 96 issues and 116 PRs open, and a modern 2025–26 stack (Next.js 16, React 19, Node 24). Saleor has 208 issues and 107 PRs open. Medusa has 84 issues and 32 PRs, and requires Node ≥22.22. Mercur has 15 issues and 8 PRs. — [Spree](https://github.com/spree/spree); [Saleor](https://github.com/saleor/saleor); [Medusa](https://github.com/medusajs/medusa); [Mercur](https://github.com/mercurjs/mercur)

### Inferences
- Version requirements (Next.js 16, Node 24, Node ≥22.22, Rails 8.1.2) suggest Spree, Medusa and even Sharetribe Go's dependencies were updated in 2025–2026. This indirectly supports recent activity, but exact last-commit dates are unverified.

### Gaps
- Exact last-commit or release dates for all repos as of November 2026 (not retrievable in this session).

## Which modern stacks (Next.js, React, Node, Rails, Django, Laravel) are best represented?

### Takeaway
TypeScript/Node/React dominates. Medusa and Mercur use Node, React/Vite and Postgres. Cal.diy uses Next.js, tRPC and Prisma. The Sharetribe Web Template uses React with SSR on Node/Express. Rails is strongly represented by Spree 5, which pairs a Rails API with a Next.js storefront, and by legacy Sharetribe Go. Laravel has Bagisto, Django/Python has Saleor (no marketplace) and Symfony has the legacy Cocorico. No credible Supabase-based full marketplace boilerplate was found.

### Cited Findings
- Medusa: TypeScript, Node, React, PostgreSQL, Turbo monorepo. — [GitHub](https://github.com/medusajs/medusa)
- Mercur: TypeScript, Node 20+, React/Vite, Postgres, Redis, Bun. — [GitHub](https://github.com/mercurjs/mercur)
- Spree: Rails backend, Next.js 16 / React 19 storefront, Vite admin. — [GitHub](https://github.com/spree/spree)
- Cal.diy: Next.js, tRPC, Prisma, PostgreSQL. — [GitHub](https://github.com/calcom/cal.com)
- Sharetribe Web Template: React (create-react-app) with SSR. — [GitHub](https://github.com/sharetribe/web-template)
- Saleor: Python with a GraphQL API. Bagisto: Laravel + Vue. Cocorico: PHP/Symfony + MongoDB. — [Saleor](https://github.com/saleor/saleor); [Bagisto](https://github.com/bagisto/bagisto); [Cocorico](https://github.com/Cocolabs-SAS/cocorico)
- No complete OSS Next.js + Supabase two-sided service marketplace found. — [search results summary](https://awesome.ecosyste.ms/projects/github.com%2Frofiyev%2Fdilshod-ui)

### Inferences
- A Next.js/TypeScript team could combine Mercur (vendors, commissions, Connect payouts) with Cal.diy's scheduling logic, or use Spree 5 with its Next.js storefront. Either way they would build messaging and two-way reviews themselves.

### Gaps
- Language byte breakdown (GitHub /languages API blocked) and approximate LOC per repo.
