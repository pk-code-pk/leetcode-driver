# Open-Source TaskRabbit/Fiverr/Upwork-Style Gig and Service Marketplaces (as of 2026-11-15)

Method note: Repository metadata (stars, forks, pushed_at, license SPDX, primary language, repo size in KB, archived flag) comes from the GitHub Search API, queried 2026-11-15. The per-repo endpoints (`/repos/OWNER/REPO`, `/languages`, `/contributors`) were blocked in this session, so **language byte breakdowns, exact LOC and contributor counts could not be verified** except where noted. "Size" is GitHub's repo size (includes git history and assets), so it is only a rough proxy for codebase size. "pushed" is the last push to any branch, which can be dependency bumps rather than feature work.

Quick reference table (GitHub Search API, 2026-11-15):

| Repo | Stars | Forks | Last push | License (GitHub SPDX) | Main language | Repo size | Status |
|---|---|---|---|---|---|---|---|
| sharetribe/sharetribe (Sharetribe Go) | 2,450 | 1,322 | 2026-11-05 | NOASSERTION (Sharetribe Community Public License) | Ruby | ~141 MB | Not actively maintained (per README) |
| sharetribe/web-template | 69 | 280 | 2026-11-11 | NOASSERTION in API; LICENSE file = Apache-2.0 | JavaScript | ~35 MB | Active |
| sharetribe/ftw-daily / ftw-hourly / ftw-product | 101 / 48 / 17 | 901 / 357 / 106 | 2025-05 | NOASSERTION (Apache-2.0 historically) | JavaScript | ~23 MB each | Archived/deprecated |
| Cocolabs-SAS/cocorico | 874 | 589 | 2021-10-19 | MIT | PHP | ~4.4 MB | Dormant since 2021 |
| agriya/getlancerv3-bidding | 25 | 13 | 2020-09-04 | none detected (README: OSL-3.0 + commercial dual license) | JavaScript | ~51 MB | Abandoned |
| agriya/getlancerv3-quote | 3 | – | 2018-11-30 | none detected (OSL-3.0 per suite README) | JavaScript | ~50 MB | Abandoned |
| agriya/fpplatform | 34 | – | 2019-06-11 | (OSL-3.0 + commercial per README) | PHP | – | Abandoned |
| algora-io/algora | 1,543 | 163 | 2026-07-18 | AGPL-3.0 | Elixir | ~82 MB | Active-ish |
| gitcoinco/web | 1,825 | 773 | 2024-08-09 | NOASSERTION | JavaScript | ~1.2 GB | Inactive since 2024 |
| mercurjs/mercur | 1,899 | 487 | 2026-11-12 | MIT | TypeScript | ~224 MB | Active (product marketplace, not services) |
| freelancezero/freelancezero | 5 | 7 | 2026-08-26 | MIT | TypeScript | ~0.4 MB | v0.1 MVP |
| anfiquehussain/Freelance-Marketplace-Django | 32 | 17 | 2025-06-05 | MIT | HTML (Django) | ~4.8 MB | Student-scale |
| omerada/marifetbul-platform | 3 | 0 | 2026-03-06 | MIT | TypeScript (Next.js 16 + Spring Boot 3.4) | ~13.9 MB | Solo project |
| vapvarun/wp-sell-services | 2 | 0 | 2026-11-15 | NOASSERTION | PHP (WordPress plugin) | ~85 MB | Active, tiny community |
| Verity (abhinav077/...) | 42 | 0 | 2026-05-19 | none | TypeScript/Solidity | ~1.2 MB | Hackathon-style Web3 |
| pH-7/pH4Marketplace | 11 | 10 | 2019-10-21 | none | Django | ~0.3 MB | Abandoned |
| yonureker/TaskRubyt, eLZyBee/chore-bunny, shoemker/MaskedHabbit | 12 / 14 / 13 | – | 2023 | none | JavaScript (Rails/React clones) | small | Bootcamp clones |

## Which open-source projects come closest to TaskRabbit (task posting + tasker profiles + booking/offers + reviews + payments)?

### Takeaway
No single, actively maintained, permissively licensed, self-hostable codebase delivers the full TaskRabbit feature set. The closest real candidates are Sharetribe Go (full stack, Stripe, reviews, messaging, but source-available and no longer actively maintained), Sharetribe Web Template (actively maintained and Apache-2.0, but only a frontend that needs Sharetribe's paid hosted backend), Cocorico (MIT, full service/rental marketplace, but dormant since 2021 on Symfony 3.4/PHP 7.1), and Agriya Getlancer Quote/Bidding (built specifically as Thumbtack/TaskRabbit/Freelancer clones, but abandoned since 2018-2020 on AngularJS). Algora is a strong, active two-sided "hire/bounty" platform with Stripe payouts, but it targets software engineers, not local tasks.

### Cited Findings
**Sharetribe Go (sharetribe/sharetribe)**
- Stack: Ruby 3.4.8, Rails 8.1.2, MySQL 8.4, React + jQuery, Node 18.16, delayed_job, S3 image hosting; tests use factory_bot, capybara, rspec-rails, cucumber-rails, selenium — [README](https://github.com/sharetribe/sharetribe/blob/master/README.md)
- README states: "IMPORTANT: Sharetribe Go is no longer actively maintained." It points to "The New Sharetribe" (SaaS) as the replacement — [README](https://github.com/sharetribe/sharetribe/blob/master/README.md)
- Payments: PayPal and Stripe are integrated, but PayPal only works on marketplaces hosted by Sharetribe.com; Stripe works in the source-available version (supported since release 7.2.0) — [README Payments section](https://github.com/sharetribe/sharetribe/blob/master/README.md#payments)
- ~19,572 commits on master; CircleCI and Code Climate badges — [GitHub repo page](https://github.com/sharetribe/sharetribe)
- 2,450 stars, 1,322 forks, last push 2026-11-05, created 2012-05-25 — GitHub Search API (2026-11-15)
- Sharetribe said it will "eventually" sunset Go and share the timeline later. No dated end-of-life notice was found — [Sharetribe community post](https://www.sharetribe.com/community/t/sharetribe-go-is-no-longer-actively-maintained-discover-the-new-sharetribe/3754)

**Sharetribe Web Template (sharetribe/web-template)**
- A template web app (create-react-app with server-side rendering and code splitting) for Sharetribe marketplaces. Setup is `yarn install && yarn run config && yarn run dev`, and the README includes Heroku deployment docs — [README](https://github.com/sharetribe/web-template/blob/main/README.md)
- The LICENSE file is Apache-2.0 ("Copyright 2018 Sharetribe") — [LICENSE](https://github.com/sharetribe/web-template/blob/main/LICENSE); 11,467 commits on main — [GitHub repo page](https://github.com/sharetribe/web-template)
- Headless architecture: when a marketplace is customized with code, Sharetribe hosts and manages the backend (Marketplace API) and you host the frontend — [Sharetribe marketplace template page](https://www.sharetribe.com/features/marketplace-template.md)
- Payments use Stripe Connect Custom accounts, created through the Marketplace API. Transaction processes (for example, a default request/accept booking flow) are defined in Sharetribe's transaction engine and edited with the Sharetribe CLI. Reviews stay hidden until both parties have reviewed or the review period ends. Messages are threaded together with the transaction timeline — [Sharetribe payments overview](https://www.sharetribe.com/docs/concepts/payments/payments-overview/), [Stripe providers/customers doc](https://www.sharetribe.com/docs/concepts/providers-and-customers-on-stripe-platform), [Transaction engine](https://www.sharetribe.com/features/transaction-engine.md)
- 69 stars, 280 forks, last push 2026-11-11 — GitHub Search API. Its predecessors ftw-daily, ftw-hourly and ftw-product are archived ("Deprecated!") — GitHub Search API

**Cocorico (Cocolabs-SAS/cocorico)**
- "Open source platform ... to create collaborative consumption marketplaces," MIT licensed, with Travis CI and a Packagist package. It has docs for server/app install, crons, MongoDB, prices, times, tests and deployment — [README](https://github.com/Cocolabs-SAS/cocorico), [doc index](https://github.com/Cocolabs-SAS/cocorico/blob/master/doc/index.md)
- composer.json requires PHP ^7.1 and Symfony ^3.4, plus Doctrine MongoDB ODM with ext-mongo 1.6.14 (MySQL and MongoDB hybrid). The ROADMAP still lists Symfony 2.x deprecation fixes and an "APIfication"/front refactor as unreleased — [composer.json](https://github.com/Cocolabs-SAS/cocorico/blob/master/composer.json), [ROADMAP](https://github.com/Cocolabs-SAS/cocorico/blob/master/ROADMAP.md)
- The repo description says "Cocorico has evolved into Second (www.scnd.com)," an enterprise product for service and rental marketplaces. Stats: 329 commits, 874 stars, 589 forks, last push 2021-10-19 — [GitHub repo page](https://github.com/Cocolabs-SAS/cocorico); GitHub Search API

**Agriya Getlancer suite and FPPlatform**
- Getlancer Bidding is "an open source service marketplace script ... similar to Freelancer," written in AngularJS with a REST API. It was originally a paid script (~€60,000) and is now dual-licensed OSL 3.0 plus commercial. The suite includes Bidding (Freelancer/Guru/oDesk clones), **Quote (Thumbtack, Zaarly, Redbeacon, TaskRabbit clones)**, Jobs and Portfolio. Features listed: employer/freelancer dual sign-up, geo-based listing, category form builder — [Getlancer Bidding README](https://github.com/agriya/getlancerv3-bidding)
- FPPlatform is fixed-price "Fiverr clone / microworkers" software for micro jobs and errands, online and offline. It was originally ~€10,000 and is now dual OSL 3.0 plus commercial — [FPPlatform README](https://github.com/agriya/fpplatform)
- Getlancer Bidding: 25 stars, 69 open issues, last push 2020-09-04. getlancerv3-quote: 3 stars, last push 2018-11-30. fpplatform: 34 stars, last push 2019-06-11 — GitHub Search API

**Algora (algora-io/algora)**
- Connects companies and developers for full-time and contract work. The codebase has a web app to publish and manage SWE jobs, contracts and bounties, a GitHub app for bounties and tips, and "a payment processor to handle payouts, compliance & 1099s." It can be self-hosted — [README](https://github.com/algora-io/algora)
- Stack: Elixir/Phoenix 1.7 + LiveView, Ecto (Postgres), stripity_stripe — [mix.exs](https://github.com/algora-io/algora/blob/main/mix.exs). 1,543 stars, AGPL-3.0, last push 2026-07-18 — GitHub Search API

**Newer small projects (2025-2026)**
- Freelancezero: "open-source, zero-fee Upwork alternative." Next.js 15, TypeScript, Tailwind/shadcn, PostgreSQL + Prisma 6, Auth.js, pluggable payment adapters, Docker self-host. Self-described "Status: v0.1 — MVP foundation" (data model, auth, core API, homepage). The platform is a "coordinator, never a custodian of money," so there is no escrow — [README](https://github.com/freelancezero/freelancezero); 5 stars — GitHub Search API

### Inferences
- **Feature coverage, best judgment from the sources above:**
  - Sharetribe Go: both user roles, listings, search, messaging, reviews, Stripe. The model is listing-centric (provider posts a service, customer books or requests), not "client posts a task and taskers bid."
  - Web Template + Sharetribe backend: the most complete feature set (request/accept booking, Stripe Connect payouts, reviews, messaging), but not self-hostable.
  - Cocorico: service/rental booking with availability calendars. I believe payments go through MangoPay, but I could not confirm this from composer.json (no direct match found).
  - Getlancer Quote: the only codebase explicitly built around the TaskRabbit/Thumbtack "post request → receive quotes" flow, but the code is 6+ years stale.
- For a TaskRabbit-style "post a task, receive offers" model on a maintained, permissive stack, you would likely need to build on a general framework or write custom code. The existing OSS options need either a heavy modernization effort (Cocorico, Getlancer) or a license or vendor trade-off (Sharetribe).

### Gaps
- I did not verify whether Sharetribe Go ships "post a request" listing types or bidding. Its feature list beyond payments was not checked.
- Cocorico's payment provider (MangoPay) could not be confirmed from the files fetched.
- I did not open the getlancerv3-quote README or code to confirm Stripe or escrow support.
- Per-repo language breakdowns and LOC are unavailable because the GitHub `/languages` endpoint was blocked.

## Which are production-grade vs. hobby clones?

### Takeaway
Production-grade or once-commercial: Sharetribe Go (12+ years, ~19.6k commits, tests, CI), Sharetribe Web Template (~11.5k commits, CI, extensive developer docs), Cocorico (commercially backed, docs and tests, but stale), Agriya's formerly paid scripts (commercial origin, but abandoned), Algora (runs a live business), and Gitcoin (ran a large bounty platform, inactive since 2024). Almost everything returned by topic searches (taskrabbit-clone, fiverr-clone, upwork-clone, freelance-marketplace, service-marketplace) is either a bootcamp clone with 0-40 stars or a SEO/marketing repo for a paid "clone script" with no source code.

### Cited Findings
- Sharetribe Go tests use rspec-rails, cucumber-rails, capybara and selenium, with a CircleCI build badge — [README](https://github.com/sharetribe/sharetribe/blob/master/README.md)
- Web Template has a CircleCI badge and full developer docs (getting started, env config, customization guide) — [README](https://github.com/sharetribe/web-template/blob/main/README.md)
- Cocorico has a docs page on tests, a Travis CI badge and a live demo link — [README](https://github.com/Cocolabs-SAS/cocorico), [doc index](https://github.com/Cocolabs-SAS/cocorico/blob/master/doc/index.md)
- Gitcoin web: 1,825 stars, 773 forks, ~1.2 GB repo, last push 2024-08-09 ("Grow Open Source") — GitHub Search API
- Mercur: "open-source, headless platform for building multi-vendor marketplaces ... vendor onboarding, multi-vendor catalogs, offers, commissions, and automated payouts," MIT licensed, built on Medusa. It is aimed at **product** commerce ("A Mirakl alternative"), not service bookings — [README](https://github.com/mercurjs/mercur); 1,899 stars, last push 2026-11-12 — GitHub Search API
- **"Clone script" marketing repos with no real source.** For example, zipprrofficial/taskrabbit-clone (11★), migrateshop/taskrabbit-clone, sangvishtechnologies/*, arunachalam-4758/Taskrabbit-Clone-Script (Appkodes), Miracuves-Solutions/upwork-clone. The GitHub API reports language = null and no license, which indicates README-only repos advertising paid products — GitHub Search API (topic:taskrabbit-clone, topic:upwork-clone)
- **Bootcamp/tutorial clones:**
  - TaskRabbit-style: eLZyBee/chore-bunny (14★, 2023), shoemker/MaskedHabbit (13★, 2023), yonureker/TaskRubyt (12★, 2023, "hire taskers for home projects"), hnrywltn/chorebunny (5★, Python), pknipp/TaskRabbitClone
  - Fiverr-style: anurag270102/fiverr-clone (36★), pasanjg/FiverrClone (38★, Flutter UI only), vikas-parmar/FiverrClone (React frontend)
  - Upwork-style: belalQassem/upwork-clone (16★, React + json-server)
  - Source: GitHub Search API
- **Notable small but more complete 2025-2026 projects** (each 0-42★, mostly single-author):
  - anfiquehussain/Freelance-Marketplace-Django (32★, MIT, 2025)
  - KiptooMannu/Client-Worker-Connection-Platform (9★, MIT, TypeScript, "secure" payments)
  - omerada/marifetbul-platform (Next.js 16 + Spring Boot 3.4, MIT)
  - adityasah15/skillshift (escrow + real-time chat, MIT)
  - vapvarun/wp-sell-services (Fiverr-style WordPress plugin with vendor management, order workflow and messaging)
  - JasonD21/service-marketplace (C#, Stripe Connect split payments MVP, MIT)
  - Moutacdie2000/bazar-marketplace (Django + DRF + Channels + Stripe Connect, MIT)
  - Source: GitHub Search API descriptions
- Web3 variants: Verity (42★, "fully on-chain, trustless freelancing platform" on Ethereum), solanahub, Cardano escrow backends. These are hackathon-scale — GitHub Search API

### Inferences
- In 2025-2026, many new "full-stack freelance marketplace" repos appear (often AI-assisted portfolio projects). None has meaningful adoption (stars < 50, 0-1 contributors), so treat them as reference code, not production foundations.
- Gitcoin and Algora show that the most active OSS two-sided labor marketplaces are developer-bounty platforms, not local-services platforms.

### Gaps
- Contributor counts could not be retrieved (GitHub page sections were empty in fetches and the API was blocked).
- I did not run any of the codebases, so setup difficulty is inferred from READMEs: Sharetribe Go needs Ruby + MySQL + Node; Cocorico needs legacy PHP 7.1 + the deprecated ext-mongo, which is hard on modern OSes; the Web Template is easy (yarn) but needs a Sharetribe account.

## What are the licenses and are they usable commercially?

### Takeaway
Permissive and commercially usable: Cocorico (MIT), Sharetribe Web Template (Apache-2.0, but tied to Sharetribe's paid backend), Mercur (MIT), Freelancezero and most small clones that declare MIT. Restricted: Sharetribe Go's Community Public License allows commercial use of your own marketplace but forbids offering it as a competing SaaS/PaaS to multiple clients. Copyleft: Algora (AGPL-3.0, network copyleft) and Agriya's OSL-3.0 (copyleft that is triggered by network deployment, with paid commercial licenses offered). Many clones declare no license, so legally no reuse rights are granted.

### Cited Findings
- **Sharetribe Community Public License 1.0** grants the right to use, modify, distribute and reproduce the software. It excludes making it "available as a software-as-a-service or platform-as-a-service where You host the Software for multiple clients or other similar online services that compete with Sharetribe." It requires attribution notices, forbids sublicensing and terminates automatically on breach. Governed by Finnish law — [LICENSE](https://github.com/sharetribe/sharetribe/blob/master/LICENSE)
- Go moved from MIT to this license in 2019 ("source-available after being open-source for 8 years") — [Sharetribe blog](https://sharetribe.com/balanced/sharetribe-go-becomes-source-available)
- Web Template: Apache License 2.0 — [LICENSE](https://github.com/sharetribe/web-template/blob/main/LICENSE). The backend it depends on is Sharetribe-hosted — [Sharetribe template page](https://www.sharetribe.com/features/marketplace-template.md)
- Cocorico: MIT — [README](https://github.com/Cocolabs-SAS/cocorico)
- Getlancer and FPPlatform: "dual license (OSL 3.0 & Commercial)" — [Getlancer README](https://github.com/agriya/getlancerv3-bidding), [FPPlatform README](https://github.com/agriya/fpplatform). GitHub detects no license file for these repos — GitHub Search API
- Algora: AGPL-3.0. Mercur and Freelancezero: MIT. Gitcoin web: NOASSERTION (custom or unrecognized) — GitHub Search API

### Inferences
- Running your own single TaskRabbit-style marketplace on Sharetribe Go is commercially allowed. Building a multi-tenant "marketplace builder" SaaS on it is not.
- Using AGPL (Algora) or OSL-3.0 (Agriya) code in a hosted commercial product requires publishing your modifications (or buying Agriya's commercial license).
- Repos with no license (TaskRubyt, chore-bunny, pH4Marketplace, Getlancer per GitHub detection) should not be reused commercially without permission.

### Gaps
- I did not inspect Gitcoin's license text. Agriya's OSL claim rests on README statements without a detected LICENSE file.

## How active/maintained is each?

### Takeaway
As of November 2026: Sharetribe Web Template is active (pushed 2026-11-11). Sharetribe Go still receives pushes (2026-11-05; it is on Rails 8.1.2) but is officially "no longer actively maintained." Mercur is active. Algora was last pushed in July 2026. Cocorico (2021), Agriya Getlancer/FPPlatform (2018-2020) and Gitcoin web (2024) are effectively abandoned. The FTW templates are archived.

### Cited Findings
- Last push dates: sharetribe/sharetribe 2026-11-05; web-template 2026-11-11; ftw-daily/hourly/product archived (last push 2025-05); cocorico 2021-10-19; getlancerv3-bidding 2020-09-04; getlancerv3-quote 2018-11-30; fpplatform 2019-06-11; algora 2026-07-18; gitcoinco/web 2024-08-09; mercur 2026-11-12; freelancezero 2026-08-26 (created 2026-08-03) — GitHub Search API, 2026-11-15
- Sharetribe Go's README lists Ruby 3.4.8 / Rails 8.1.2, so dependencies are being kept current despite the "no longer actively maintained" notice — [README](https://github.com/sharetribe/sharetribe/blob/master/README.md)
- Cocorico's description says the project "has evolved into Second (scnd.com)," which implies commercial effort moved to the closed product — [GitHub repo page](https://github.com/Cocolabs-SAS/cocorico)

### Inferences
- Sharetribe Go's recent pushes are probably security and dependency upkeep rather than feature work. Its eventual sunset (no date announced) is a long-term risk.
- Actively maintained, permissively licensed, self-hostable service-marketplace software is effectively missing from the OSS landscape. Commercial vendors (Sharetribe, Second/Cocolabs, Agriya, clone-script sellers) have pulled their full-featured products into SaaS or paid licenses.

### Gaps
- No verified 2026 commit counts or contributor activity per repo (API blocked).
- Did not check awesome-selfhosted or HN/Reddit threads for additional candidates. Searches of GitHub topics and keywords surfaced no other substantial (>100★) service/gig marketplace codebases besides those listed.
