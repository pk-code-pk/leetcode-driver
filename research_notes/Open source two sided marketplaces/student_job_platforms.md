# Open-Source Two-Sided Job / Internship / Student-Gig Platforms

Method note: GitHub repo metadata (stars, forks, pushed_at, license, archived flag, repo size) was pulled on 2026-11-15 via the GitHub Search API (`gh api search/repositories -f q="repo:OWNER/NAME ..."`). The per-repo REST endpoints (`/repos/X`, `/languages`, `/contributors`) and GraphQL were blocked in this session, so **contributor counts and GitHub's own language byte breakdowns are not available**. Instead, 22 repos were shallow-cloned and non-blank lines of code were counted with a custom script (excludes node_modules/vendor/static/public/lib/dist and *.min.*, files >20k lines). Counts are approximate ("LOC" below = non-blank source lines incl. templates/CSS). "Feature present" claims come from reading READMEs, model/schema files and migrations in the clones. "pushed" = last push date to any branch (activity proxy, not necessarily a feature commit).

## Which open-source job/internship/student-employer platforms are the most complete two-sided apps (both candidate and employer dashboards)?

### Takeaway
The most complete, actively maintained two-sided job boards are **MicroPyramid/opensource-job-portal (PeelJobs, Django 4.2 + SvelteKit recruiter app, MIT)** and **Assystant/SpotAxis (Django ATS + job board + payments, MIT)**, followed by **manjurulhoque/django-job-portal (smaller, MIT, well-maintained)**. **OpenCATS (PHP, MPL-2.0)** and **YAWIK (PHP/Laminas, MIT, stale since 2023)** are substantial but recruiter/ATS-centric with only a thin candidate side. Most MERN/Laravel "job portal" repos found are tutorial-grade (<10k LOC, no license).

### Cited Findings

**Tier 1 - substantial, two-sided, maintained**

- **MicroPyramid/opensource-job-portal ("PeelJobs")** — https://github.com/MicroPyramid/opensource-job-portal
  - 494 stars, 262 forks, pushed 2026-10-30, MIT, not archived; ~53k LOC (Python ~33k, HTML templates ~13.7k, TS ~5.6k) — [GitHub](https://github.com/MicroPyramid/opensource-job-portal)
  - Stack per README: Django 4.2.22, PostgreSQL (full-text search with tsvector + pg_trgm), Celery 5.5 + Redis, Redis+Memcached caching, Bootstrap 5 + Tailwind 4; separate `recruiter/` app in SvelteKit (svelte.config.js, vite) — [README](https://github.com/MicroPyramid/opensource-job-portal/blob/master/README.md)
  - Roles: Recruiters, Company Admin, Candidates (profiles w/ skills, experience), Super Admin, Support staff; features: job posting, application management, walk-in interview events w/ Google Maps, bulk ops, analytics dashboard, Google OAuth, job alerts — [README](https://github.com/MicroPyramid/opensource-job-portal)
  - Data models (backend/peeldb) include User, Company, JobPost, AppliedJobs, SavedJobs, JobAlert, Skill/TechnicalSkill, EducationDetails, EmploymentHistory, Project, Certification, Attachment (resume), UserMessage (messaging), TeamInvitation, Agency* models (agency recruiting), Ticket (support) — [peeldb models](https://github.com/MicroPyramid/opensource-job-portal/tree/master/backend/peeldb)
  - Quality: readthedocs docs site, SETUP.md, ~18 test files, Behave BDD, Ruff, Docker support — [README](https://github.com/MicroPyramid/opensource-job-portal)
  - Missing: payments, reviews/ratings of employers or candidates (none found in models).
  - Setup: moderate (Postgres + Redis + Celery + Node for recruiter app).

- **Assystant/SpotAxis** — https://github.com/Assystant/SpotAxis
  - 34 stars, 32 forks, pushed 2025-10-06, MIT; ~113k LOC (Python ~61.5k, HTML ~51.7k), ~78 test-ish files — [GitHub](https://github.com/Assystant/SpotAxis)
  - README describes an MIT ATS with two user types: companies (post jobs, job templates, branded career sites, resume parsing, custom application forms, collaborative hiring, per-job pipelines, candidate ratings) and SaaS operators (multi-org super admin, aggregated default job board, subscription/pricing management) — [README](https://github.com/Assystant/SpotAxis/blob/master/README.md)
  - Models: candidates app (Candidate, Expertise, Academic, Language, Training, Certificate, Project, Curriculum = CV), companies (Company, Recruiter, Wallet, Recommendations, Stage), vacancies (Vacancy, Question, Candidate_Fav, Postulate = application, Postulate_Score, Postulate_Stage, Comment), payments (Services, Package, Subscription, Transactions, Discount), activities (MessageChunk, Activity, Notification), scheduler (Schedule = interviews); also resume_parser, helpdesk, *_api apps — [repo tree](https://github.com/Assystant/SpotAxis)
  - CONFLICT: README "Project Dependencies" still lists Python 2.7 / Django 1.9.5, but `pyproject.toml` requires Python >=3.12 and django>=5.2.1 — code appears migrated; README stale — [README](https://github.com/Assystant/SpotAxis/blob/master/README.md) vs [pyproject.toml](https://github.com/Assystant/SpotAxis/blob/master/pyproject.toml)
  - Low stars/community; single-company project. Payments are SaaS-subscription oriented (employer pays platform), not candidate payouts.

- **manjurulhoque/django-job-portal** — https://github.com/manjurulhoque/django-job-portal
  - 625 stars, 277 forks, pushed 2026-11-06, MIT; small: ~8.6k LOC (Python ~4.6k, HTML ~4k), 23 test files, GitHub Actions CI, Docker/docker-compose, Jenkinsfile, live demo — [GitHub](https://github.com/manjurulhoque/django-job-portal)
  - Stack: Django 5.1.2, DRF 3.15, SimpleJWT, GraphQL (graphql-jwt), django-elasticsearch-dsl, OAuth toolkit, Prometheus; README says SQLite — [requirements.txt](https://github.com/manjurulhoque/django-job-portal/blob/master/requirements.txt), [README](https://github.com/manjurulhoque/django-job-portal)
  - Models: Company, Job, Applicant, Favorite, Category, Tag, ResumeCv/ResumeCvTemplate (resume builder templates); employer can post positions, companies page, Swagger API — [jobsapp/models.py](https://github.com/manjurulhoque/django-job-portal/blob/master/jobsapp/models.py)
  - Missing: messaging, payments, reviews. Good clean starter rather than full product.

**Tier 2 - substantial but ATS-centric or stale**

- **opencats/OpenCATS** — https://github.com/opencats/OpenCATS
  - 785 stars, 332 forks, pushed 2026-11-13, 95 open issues; ~72k LOC (PHP ~39.8k, .tpl ~15.7k, JS ~13.6k), PHPUnit + CI/CD pipeline, Docker dir, docs site, forums — [GitHub](https://github.com/opencats/OpenCATS)
  - License: dual — OpenCATS code under MPL-2.0; original 2007 CATS code under "CATS Public License 1.1a (a modified MPL)"; GitHub shows NOASSERTION — [LICENSE.md](https://github.com/opencats/OpenCATS/blob/master/LICENSE.md). Commercial use generally allowed under MPL (file-level copyleft) but the CATS PL portion should be legally reviewed.
  - README: ATS "designed for Recruiters" from job posting through candidate application to selection; active "Modernisation & Contributor Roadmap" (PHP 8.4/8.5 fixes, DB/UI, API) — [README](https://github.com/opencats/OpenCATS)
  - Candidate side is limited to a public careers portal (modules/careers) where candidates apply; no rich candidate dashboard. Recruiter-only product in practice.

- **cross-solution/YAWIK** — https://github.com/cross-solution/YAWIK
  - 132 stars, pushed 2023-08-30 (stale ~3 yrs), MIT; ~154k LOC (PHP ~145k), ~507 test/spec files, Behat, PHPStan, Scrutinizer/Coveralls badges — [GitHub](https://github.com/cross-solution/YAWIK)
  - README: web app for managing job applications; jobs can be entered or pushed; applicants and recruiters connect via social networks; self-described "alpha"; used by job boards gastrojob24.ch, stellenmarkt.com, vertriebskarriere.com — [README](https://github.com/cross-solution/YAWIK)
  - Stack: Laminas/Zend-style PHP modules, MongoDB (per project docs; not re-verified here). Likely abandoned.

- **Automattic/WP-Job-Manager** — https://github.com/Automattic/WP-Job-Manager — 897 stars, pushed 2026-11-13, GPL-3.0, ~19.8MB repo — [GitHub search API data](https://github.com/Automattic/WP-Job-Manager). WordPress plugin: employers post listings, front-end job submission. (Not cloned; candidate resumes/applications are, from prior knowledge, sold as paid add-ons — unverified here.)

- **NIAEFEUP/nijobs-be + nijobs-fe** — see student section below (archived).

- **joemasilotti/railsdevs.com** — https://github.com/joemasilotti/railsdevs.com — 801 stars, MIT, **archived**, last push 2025-07-28; ~19.7k LOC Ruby/ERB, 192 test files — [GitHub](https://github.com/joemasilotti/railsdevs.com)
  - "Reverse job board": developers create profiles, businesses pay a subscription to message them; models: Developer, Business, Conversation, Message, ColdMessage, HiringAgreements, BusinessSubscriptionCheckout, Pay (Stripe via `pay` gem), RevenueCat, Notification, Referral — [app/models](https://github.com/joemasilotti/railsdevs.com/tree/main/app/models)
  - README: "RailsDevs is gone but the code will live forever"; code MIT but "everything else (IP, copy, assets, etc.) is not" — [README](https://github.com/joemasilotti/railsdevs.com)
  - Excellent production-grade reference (real business ran on it) for profiles + paid messaging + hiring agreements.

**Tier 3 - small / tutorial / demo-quality (flag)**

- **b30wulffz/job-portal** (MERN) — 246 stars, pushed 2024-05-10, **no license**, ~7k LOC JS; applicant/recruiter roles, resume & profile upload — [GitHub](https://github.com/b30wulffz/job-portal). Course project; no license = no legal reuse.
- **exclusiveabhi/react-job-portal** (MERN) — 146 stars, pushed 2026-10-06, **no license**, ~4k LOC; JWT auth for seekers/employers, application management, Cloudinary — [GitHub](https://github.com/exclusiveabhi/react-job-portal).
- **Abdullah-moiz/Job-Portal** (Next.js + MongoDB + Redux) — 168 stars, pushed 2025-05-16, no license — [GitHub](https://github.com/Abdullah-moiz/Job-Portal).
- **ihopeit/recruitment** (Django, Chinese) — 139 stars, pushed 2024-04-16, Apache-2.0, only ~1.8k LOC of code (repo size 38MB mostly assets) — [GitHub](https://github.com/ihopeit/recruitment).
- **nueno-co/nueno** ("Open Source ATS", TS) — 269 stars, AGPL-3.0, pushed 2022-07-27, only ~1.2k LOC in clone — abandoned stub — [GitHub](https://github.com/nueno-co/nueno).
- **plutomi/plutomi** (Rust/TS ATS) — 72 stars, Apache-2.0, pushed 2025-04-10, README says "Currently WIP"; ~3.6k LOC — [GitHub](https://github.com/plutomi/plutomi).
- **jobberbase/jobberbase** (PHP) — 284 stars, MIT, last push 2019-01-19 (abandoned); **fossjobs/fossjobs** (fork, 382 stars, MIT, pushed 2025-05-06) — single-sided job posting boards — [jobberbase](https://github.com/jobberbase/jobberbase), [fossjobs](https://github.com/fossjobs/fossjobs).
- Laravel job portals (nishangupta/joblister-laravel-8 63★ 2020; nababur/JobFinder 41★; Nur-Alam39/job-portal 27★; samiulislamsharan/JobSphere 13★) — all <100 stars and no license detected by GitHub — [GitHub search "job portal laravel"](https://github.com/search?q=job+portal+laravel&type=repositories&s=stars).
- Rails job boards (rubytaiwan/jobs.ruby.tw 155★ MIT 2022; blairanderson/open-source-job-board 36★ 2023) — small/stale — [GitHub search](https://github.com/search?q=job+board+rails&type=repositories&s=stars).
- Next.js/Supabase job board starters found are tiny (e.g., waleed-mirza/boardstarter 0★ MIT, kelsiesmurphy/planetcareer 10★) — no substantial maintained Supabase job-board starter located — [GitHub search](https://github.com/search?q=job+board+nextjs+supabase&type=repositories&s=stars).
- **academy-ux/openats** — "open-source ATS: careers site and job board, pipelines, interviews", AGPL-3.0, 0 stars, pushed 2026-11-14 — too new to evaluate — [GitHub](https://github.com/academy-ux/openats).

**Adjacent, not two-sided job boards (brief)**
- **strelov1/freehire** — 3,538 stars, MIT, Go, pushed 2026-11-15 — "open-source search engine for job seekers" (aggregator, no employer side) — [GitHub](https://github.com/strelov1/freehire).
- **frappe/hrms** — 9,061 stars, GPL-3.0, pushed 2026-11-15 — full HR suite with recruitment module (employer-side job openings/applicants); not a marketplace — [GitHub](https://github.com/frappe/hrms).
- **hcengineering/platform (Huly)** — 28k stars, EPL-2.0 — includes recruiting module inside a PM suite; **ever-co/ever-gauzy** — 8.8k stars, AGPL-3.0 — business platform with candidates module — [Huly](https://github.com/hcengineering/platform), [Gauzy](https://github.com/ever-co/ever-gauzy).
- **feder-cr/Jobs_Applier_AI_Agent** (32.5k stars) and **srbhr/Resume-Matcher** (29.3k stars, Apache-2.0) are candidate-side tools only — [AIHawk](https://github.com/feder-cr/Jobs_Applier_AI_Agent), [Resume-Matcher](https://github.com/srbhr/Resume-Matcher).

### Inferences
- No open-source project combines a polished candidate dashboard, employer dashboard, messaging, matching, reviews and payments at production grade. PeelJobs is the closest "job board" match; SpotAxis has the broadest feature surface (incl. payments/subscriptions, messaging, interview scheduling, resume parsing) but low community adoption.
- Star counts are poor quality signals here: several high-star repos are tutorials (b30wulffz, exclusiveabhi) or abandoned stubs (nueno).
- For commercial reuse, MIT (PeelJobs, SpotAxis, django-job-portal, railsdevs code, YAWIK) is cleanest; GPL/AGPL (nijobs, WP Job Manager, Gauzy, nueno) imposes copyleft; Sharetribe Go's license forbids SaaS reselling (see last section).

### Gaps
- Contributor counts and commit frequency could not be retrieved (REST /contributors and /commits blocked); shallow clones only show the latest commit.
- WP Job Manager, frappe/hrms, Huly, Gauzy not cloned; feature claims for them partly from prior knowledge and marked accordingly.
- Setup difficulty was assessed from READMEs/dependency lists, not by actually running the apps.

## Are there any designed specifically for students/campus recruiting or short-term student gigs?

### Takeaway
Yes, but they are all small: **NIAEFEUP nijobs** (university student-company job board, GPL-3.0, well-tested but **archived 2024**) is the most mature campus one; **Hustl** (student shift/gig marketplace with escrow, reviews, geosearch; MIT, 2026) and **CampusGigs** (student gig marketplace, MIT, 2026) are the most feature-rich student-gig codebases but are single-developer, near-zero-star projects. Indian "Training & Placement" portals are numerous but tiny college projects.

### Cited Findings
- **NIAEFEUP/nijobs-be** (Node/Express/MongoDB-style JS backend) + **nijobs-fe** (React) — "A platform for companies to advertise their job opportunities to the students" by the FEUP (Univ. of Porto) student branch; both **archived**; be: 18★, pushed 2024-06-03, ~13.6k LOC JS; fe: 22★, pushed 2024-04-09, ~27k LOC JS, 76 test files; GPL-3.0; Codecov badge, API docs site, Jest — [nijobs-be](https://github.com/NIAEFEUP/nijobs-be), [nijobs-fe](https://github.com/NIAEFEUP/nijobs-fe)
  - Backend models: Account, Company, CompanyApplication (company onboarding approval), Offer, Point (location) — [src/models](https://github.com/NIAEFEUP/nijobs-be/tree/develop/src/models). Student side is browse/search offers; no student accounts/applications/messaging models found in BE.
- **ankan00V/Hustl** — "Tinder-style gig marketplace connecting students with businesses for short-term shifts"; MIT; 3★; pushed 2026-07-11; ~31.5k LOC TS — [GitHub](https://github.com/ankan00V/Hustl)
  - README features: match scoring (distance, skills, reputation), PostGIS geosearch, Razorpay payments with escrow, Socket.io real-time, reputation (30-day weighted), badges, urgent hiring auto-assignment, business analytics tier, anti-fraud; stack: Express + TS, PostgreSQL/PostGIS, Redis, Prisma, BullMQ, Expo React Native mobile, Tamagui; admin "planned" — [README](https://github.com/ankan00V/Hustl)
  - Prisma schema has 28 models incl. StudentProfile, BusinessProfile, Listing, Swipe, Match, ChatMessage, Review, ShiftCheckIn, DisputeThread, Wallet, WalletTransaction, PayoutRequest, Payment, College, PortfolioAsset — [prisma/schema.prisma](https://github.com/ankan00V/Hustl/blob/main/prisma/schema.prisma)
  - Only ~5 test files; firebase config files also present (mixed backend story). Demo/early quality.
- **Kanjo-Elkamira-Ndi/CampusGigs** — "A student gig marketplace for Cameroon"; MIT; 12★; pushed 2026-09-02; ~22.7k LOC TS (Next.js app with (admin)/(app)/(auth) routes + API), Flutter mobile dir, SQL migrations for users, categories, gigs, applications, reviews, messages, saved_gigs, universities, chat features — [GitHub](https://github.com/Kanjo-Elkamira-Ndi/CampusGigs), [migrations](https://github.com/Kanjo-Elkamira-Ndi/CampusGigs/tree/main/migrations)
  - PROGRESS_REPORT (2026-07-04) describes four apps: Flutter mobile, React+Vite frontend, admin panel, Express 5 + TS + PostgreSQL backend; student-to-student gigs (tutoring, event help, tech support, design, photography) — [PROGRESS_REPORT.md](https://github.com/Kanjo-Elkamira-Ndi/CampusGigs/blob/main/PROGRESS_REPORT.md). README is still the create-next-app boilerplate; 1 test file. No payments found (1 file matched).
  - Sister repo Kanjo-Elkamira-Ndi/Bolo (19★, bilingual student gig marketplace, no license) — [GitHub](https://github.com/Kanjo-Elkamira-Ndi/Bolo).
- Other student-gig repos found (all ≤4★, mostly 2026 hackathon/college projects): Revanth-432/Campus-gig-app (VNRVJIET campus tasks), ravishanamina174/UniWork-Sri-Lanka, nickypunt/GigBee, Kallina-source/skillbridge_nam (PHP), litsparks-poorvi-06 Gigsie — [GitHub search "gig marketplace students"](https://github.com/search?q=gig+marketplace+students&type=repositories&s=stars)
- Campus placement portals: Training-and-Placement-Cell-NIT-Patna/tnpcell-portal (28★, pushed 2026-11-12, no license), atinder11/Placement-Portal (19★, PHP, 2023), coding-blocks/hiring-blocks-legacy (9★, archived 2018), IOSD/hiring-portal, Gr8ayu/SPCPortal — all small — [GitHub search](https://github.com/search?q=training+and+placement+portal&type=repositories&s=stars), [hiring-blocks-legacy](https://github.com/coding-blocks/hiring-blocks-legacy)
- however-yir/campus-recruitment-recommendation-system — Spring Boot + Vue + MySQL campus recruitment w/ recommendations, MIT, 17★, pushed 2026-08-23 — [GitHub](https://github.com/however-yir/campus-recruitment-recommendation-system); kknee-dev/recruit-hub — Chinese campus recruiting info aggregator (Node 22 + node:sqlite), MIT, 11★ — [GitHub](https://github.com/kknee-dev/recruit-hub) (aggregator, not two-sided).
- The GitHub topic `internship-portal` has no repo above 6 stars (e.g., harshitkathuria/InternDigger 6★, 2021) — [GitHub topic search](https://github.com/topics/internship-portal).

### Inferences
- There is no established, community-maintained open-source "Handshake" or student TaskRabbit. The student-specific space consists of university club projects (nijobs, archived) and 2026 solo/hackathon builds (Hustl, CampusGigs) that are feature-rich on paper (often AI-assisted, cf. AGENTS.md/CLAUDE.md files present in CampusGigs) but unproven.
- Hustl's data model (StudentProfile/BusinessProfile/Listing/Match/ShiftCheckIn/Review/Wallet/Payout/College) is the closest schema to a student short-gig marketplace found anywhere; useful as a design reference even if code quality is unverified.

### Gaps
- Did not run Hustl/CampusGigs to verify features actually work end-to-end; README claims (escrow, anti-fraud) unverified.
- Could not find Reddit/HN discussion of any student-gig open-source project (not searched extensively due to tool budget).

## Which are production-grade vs. tutorial clones? Licenses and maintenance status?

### Takeaway
Production-grade (ran real businesses or have serious test suites): OpenCATS, PeelJobs, YAWIK (stale), railsdevs (archived but MIT), Sharetribe Go (source-available, unmaintained-by-vendor), WP Job Manager. Everything in the MERN/Laravel "job portal" and "Upwork/Fiverr/TaskRabbit clone" categories is tutorial/demo grade, usually unlicensed.

### Cited Findings
Summary table (data as of 2026-11-15; LOC from shallow clone, approx.):

| Repo | Stars | Last push | License (commercial OK?) | Stack | ~LOC | Tests | Status |
|---|---|---|---|---|---|---|---|
| [MicroPyramid/opensource-job-portal](https://github.com/MicroPyramid/opensource-job-portal) | 494 | 2026-10-30 | MIT (yes) | Django 4.2/Postgres/Celery/Redis + SvelteKit | 53k | 18 files + BDD | Active |
| [Assystant/SpotAxis](https://github.com/Assystant/SpotAxis) | 34 | 2025-10-06 | MIT (yes) | Django 5.2/Py3.12 (per pyproject) | 113k | ~78 files | Slow, small community |
| [manjurulhoque/django-job-portal](https://github.com/manjurulhoque/django-job-portal) | 625 | 2026-11-06 | MIT (yes) | Django 5.1/DRF/GraphQL/ES | 8.6k | 23 files, CI | Active, small |
| [opencats/OpenCATS](https://github.com/opencats/OpenCATS) | 785 | 2026-11-13 | MPL-2.0 + CATS PL 1.1a (yes, w/ file-level copyleft; review) | PHP/MySQL | 72k | PHPUnit, CI | Active modernisation |
| [cross-solution/YAWIK](https://github.com/cross-solution/YAWIK) | 132 | 2023-08-30 | MIT (yes) | PHP (Laminas) | 154k | ~507 files | Stale/likely abandoned |
| [joemasilotti/railsdevs.com](https://github.com/joemasilotti/railsdevs.com) | 801 | 2025-07-28 | MIT code only (yes; not brand/assets) | Rails/Hotwire/Stripe | 19.7k | 192 files | Archived |
| [NIAEFEUP/nijobs-be](https://github.com/NIAEFEUP/nijobs-be)/[fe](https://github.com/NIAEFEUP/nijobs-fe) | 18/22 | 2024 | GPL-3.0 (copyleft) | Node/Express + React | 13.6k + 27k | Jest, Codecov | Archived |
| [Automattic/WP-Job-Manager](https://github.com/Automattic/WP-Job-Manager) | 897 | 2026-11-13 | GPL-3.0 | WordPress/PHP | n/a (19.8MB) | n/a | Active |
| [sharetribe/sharetribe](https://github.com/sharetribe/sharetribe) | 2,450 | 2026-11-05 | Sharetribe Community Public License (source-available; no competing SaaS) | Rails 8.1/MySQL/React | 118k | 259 files (rspec/cucumber) | "No longer actively maintained" but deps updated |
| [sharetribe/web-template](https://github.com/sharetribe/web-template) | 69 (280 forks) | 2026-11-11 | Apache-2.0 (frontend only) | React SSR; needs paid Sharetribe API | 156k | 95 files | Active (vendor) |
| [Cocolabs-SAS/cocorico](https://github.com/Cocolabs-SAS/cocorico) | 874 | 2021-10-19 | MIT (yes) | Symfony/PHP | 91k | ~1 | Abandoned |
| [gitcoinco/web](https://github.com/gitcoinco/web) | 1,825 | 2024-08-09 | NOASSERTION (AGPL per project, unverified) | Django | 1.19GB repo | — | Dormant |
| [ankan00V/Hustl](https://github.com/ankan00V/Hustl) | 3 | 2026-07-11 | MIT | Express/Prisma/PostGIS + Expo | 31.5k | ~5 | Solo, early |
| [Kanjo-Elkamira-Ndi/CampusGigs](https://github.com/Kanjo-Elkamira-Ndi/CampusGigs) | 12 | 2026-09-02 | MIT | Next.js/Express/Postgres + Flutter | 22.7k | 1 | Solo, early |
| [freelancezero/freelancezero](https://github.com/freelancezero/freelancezero) | 5 | 2026-08-26 | MIT | Next.js 15/Prisma/Postgres/Auth.js | 10.8k | 1 | v0.1 MVP |
| [adityasah15/skillshift](https://github.com/adityasah15/skillshift) | 3 | 2026-10-22 | MIT | Next.js 16 + NestJS 11/Prisma 7/Redis | 22k | ~38 files ("225 passing") | Portfolio-grade |
| [omerada/marifetbul-platform](https://github.com/omerada/marifetbul-platform) | 3 | 2026-03-06 | MIT | Next.js 16 FE; Spring Boot BE dir **empty** in repo | 330k TS (FE only) | Jest/Playwright | Backend missing |
| [b30wulffz/job-portal](https://github.com/b30wulffz/job-portal) | 246 | 2024-05-10 | none (no) | MERN | 7k | 2 | Tutorial |
| [exclusiveabhi/react-job-portal](https://github.com/exclusiveabhi/react-job-portal) | 146 | 2026-10-06 | none (no) | MERN | 4k | 0 | Tutorial |
| [nueno-co/nueno](https://github.com/nueno-co/nueno) | 269 | 2022-07-27 | AGPL-3.0 | TS | 1.2k | — | Abandoned stub |
| [jobberbase/jobberbase](https://github.com/jobberbase/jobberbase) | 284 | 2019-01-19 | MIT | PHP | — | — | Abandoned |

- Sharetribe Go README: "IMPORTANT: Sharetribe Go is no longer actively maintained ... remains source-available under the Sharetribe Community Public License"; stack Ruby 3.4.8, Rails 8.1.2, MySQL 8.4, React + jQuery, delayed_job, Devise, rspec/cucumber; latest commit 2026-11-05 "Merge pull request #471 ... update-rails" — [README](https://github.com/sharetribe/sharetribe)
- Sharetribe Community Public License 1.0 grants use/modify/distribute but "exclude[s] the right to make the Software available as a software-as-a-service or platform-as-a-service where You host the Software for multiple clients ... that compete with Sharetribe"; requires attribution notice — [LICENSE](https://github.com/sharetribe/sharetribe/blob/master/LICENSE). Running a single marketplace you own appears permitted; reselling hosting is not.
- Sharetribe Web Template is Apache-2.0 but is "a template web application for Sharetribe marketplaces" configured against Sharetribe's hosted Marketplace API (env vars from Sharetribe Console) — i.e., the backend is closed SaaS — [README](https://github.com/sharetribe/web-template), [LICENSE](https://github.com/sharetribe/web-template/blob/main/LICENSE)
- Cocorico: "open source platform ... to create collaborative consumption marketplaces" (booking/rental of services/assets), MIT, Symfony; last push 2021 — [README](https://github.com/Cocolabs-SAS/cocorico)
- Freelancezero README: "Status: v0.1 — MVP foundation. The data model, auth, core API, and a polished marketing homepage are in place"; 0% fee, platform "never a custodian of money", pluggable payment adapters — [README](https://github.com/freelancezero/freelancezero). Prisma schema is extensive (FreelancerProfile, ClientProfile, Company, Skill, PortfolioItem, Education, Job, Proposal, ProposalMilestone, Contract, Milestone, TimeEntry, Deliverable, Payment, Conversation, Message, Review, Dispute, Notification) — [prisma/schema.prisma](https://github.com/freelancezero/freelancezero/blob/main/prisma/schema.prisma)
- SkillShift README: escrow-protected service marketplace; wallet + escrow ledger, order cockpit with chat/files/disputes, reviews gated to completed orders, admin dispute resolution, audit log; "Payments are intentionally simulated"; atomic Prisma transactions for money movement — [README](https://github.com/adityasah15/skillshift)
- MarifetBul README describes Next.js 16 frontend + Spring Boot 3.4/PostgreSQL backend in `/marifetbul-backend`, but that directory contains 0 files in the public clone — [GitHub](https://github.com/omerada/marifetbul-platform)
- TaskRabbit/Upwork clones on GitHub are all small: e.g., eLZyBee/chore-bunny 14★ (2023), yonureker/TaskRubyt 12★, ludoguenet/upwirk 44★ (Laravel TALL, 2020, no license); several "taskrabbit-clone" repos are marketing pages for paid clone scripts (zipprrofficial, Appkodes, migrateshop) with no code — [GitHub search "taskrabbit clone"](https://github.com/search?q=taskrabbit+clone&type=repositories&s=stars), [upwirk](https://github.com/ludoguenet/upwirk)

### Inferences
- "Commercial use OK" (permissive) + maintained + substantial: PeelJobs, django-job-portal, OpenCATS (MPL). SpotAxis is permissive and substantial but its maintenance cadence (last push Oct 2025) and community are thin.
- Many 2026 repos (CampusGigs, freelancezero, skillshift, Hustl) carry AGENTS.md/CLAUDE.md files, suggesting AI-assisted generation; large LOC there does not imply battle-testing.

### Gaps
- Exact last-commit dates on default branch (vs pushed_at) not retrieved for all repos; pushed_at may reflect bot/dependency pushes.
- gitcoinco/web license not verified from the file (GitHub reports NOASSERTION).

## How close could each be adapted toward a TaskRabbit-like student gig marketplace (short tasks, booking, payments, reviews)?

### Takeaway
Job boards (PeelJobs, SpotAxis, django-job-portal, OpenCATS) give you profiles, postings and applications but lack bookings, escrow/payouts and two-way reviews — significant work. Generic marketplace engines (**Sharetribe Go**, Cocorico) already have listings, booking/transactions, payments, messaging and reviews and are structurally closer to TaskRabbit, but carry license (Sharetribe) or staleness (Cocorico, 2021) issues. Among small modern codebases, **Hustl** (student shifts + escrow + reviews + check-in), **SkillShift** (escrow orders + reviews) and **freelancezero** (contracts/milestones schema) are the nearest starting points, at demo quality.

### Cited Findings
- Keyword scan across clones (files mentioning booking/transaction): Sharetribe Go 541 files, web-template 285, Cocorico 159, Hustl 29, SkillShift 24; job boards ~0-6 (PeelJobs 6, django-job-portal 3, OpenCATS 2) — indicates booking/transaction flows exist only in marketplace engines — [sharetribe](https://github.com/sharetribe/sharetribe), [cocorico](https://github.com/Cocolabs-SAS/cocorico), [Hustl](https://github.com/ankan00V/Hustl), [PeelJobs](https://github.com/MicroPyramid/opensource-job-portal) (method: grep over shallow clones, this research)
- Payment-related files: Sharetribe Go 456 (Stripe/PayPal integrations per README "Payments" section), web-template 151, SpotAxis 55 (subscriptions/transactions), railsdevs 39 (Stripe via pay gem), freelancezero 30, Hustl 21 (Razorpay), PeelJobs ~1 — [Sharetribe README](https://github.com/sharetribe/sharetribe), [SpotAxis](https://github.com/Assystant/SpotAxis)
- Hustl already models StudentProfile, BusinessProfile, Listing, Match, ShiftCheckIn, Review, ReputationEvent, DisputeThread, Wallet, PayoutRequest, College — [schema.prisma](https://github.com/ankan00V/Hustl/blob/main/prisma/schema.prisma)
- CampusGigs models gigs, applications, reviews, messages, universities but no payments — [migrations](https://github.com/Kanjo-Elkamira-Ndi/CampusGigs/tree/main/migrations)
- railsdevs shows a production pattern for paid employer access + conversations + hiring agreements (Stripe) — [app/models](https://github.com/joemasilotti/railsdevs.com/tree/main/app/models)

Adaptation-distance estimate per candidate (inference, see below).

### Inferences
- **Sharetribe Go (closest feature-wise, risky license/maintenance):** has listings, availability/booking, transactions with Stripe/PayPal, messaging, reviews; a student-gig marketplace you operate yourself seems permitted by the Community Public License, but you cannot offer it as hosted SaaS to others, and the vendor says it is unmaintained. Rails 8.1 upgrade in Nov 2026 suggests someone still updates dependencies.
- **Sharetribe Web Template:** best UX for TaskRabbit-style booking but locks you into paid Sharetribe backend — not truly self-hostable.
- **Cocorico (MIT):** booking marketplace for services; structurally close (listings, calendar bookings, payments, reviews, messaging) but Symfony code untouched since 2021 — expect heavy dependency upgrades.
- **Hustl (MIT):** schema nearly matches "student does short shift for business, gets paid, gets rated"; lowest conceptual distance among job/gig repos, but unproven code, solo author, few tests. Good to fork for ideas or as a base if you can audit it.
- **SkillShift (MIT):** Fiverr-style (seller publishes service, buyer orders) with real escrow ledger logic and reviews; would need "task request + tasker bids/booking" inversion and real payment provider (payments simulated).
- **freelancezero (MIT):** rich Upwork-style schema (jobs → proposals → contracts → milestones → payments → reviews) but only v0.1 implementation; 0%-fee non-custodial design conflicts with marketplace escrow/commission unless changed.
- **CampusGigs (MIT):** student-specific (universities, gigs, applications, reviews, chat); needs payments and booking/scheduling.
- **PeelJobs / SpotAxis / django-job-portal:** strong for profile + posting + application + (PeelJobs/SpotAxis) messaging; would need booking calendar, escrow/payouts (Stripe Connect), two-sided reviews, task-completion workflow — essentially the whole transactional core. SpotAxis has a payments app but it is for employer subscriptions.
- **OpenCATS / YAWIK:** recruiter-only ATS; poor fit.

### Gaps
- No repo was actually run; adaptation estimates are inferred from schema/README inspection.
- Did not investigate other generic open-source marketplace engines beyond Sharetribe/Cocorico (e.g., service-booking platforms) — likely covered by other researchers in the broader "two-sided marketplaces" effort.
