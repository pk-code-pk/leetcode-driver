# Paid Add-ons for B2B Platform Marketplaces (research as of 2026-11-24)

Scope note: about 18 tool calls. The strongest evidence is for Shopify (Stocky sunset, Scripts deprecation), Slack (rate-limit change that favours Marketplace apps), QuickBooks (new API metering), Atlassian (Data Center end of life plus Forge fee schedule) and fee structures. I did **not** verify per-app install counts or star ratings on marketplace listing pages, and I collected no demand evidence for Notion, ClickUp, Webflow, Squarespace, Etsy/eBay, Intercom, Zoom or Stripe Apps. Those are listed under Gaps.

---

## Q1. Which categories have high demand but weak, abandoned or overpriced apps? (Includes the 8–15 concrete ideas)

### Takeaway
The best-evidenced openings in 2026 come from platform removals rather than from poorly rated apps. Shopify's Stocky shut down on Aug 31, 2026, and merchants say replacement apps cover purchase orders but handle receiving, cost history and supplier lead times poorly. Shopify Scripts stopped on Jun 30, 2026, which left gaps in tiered discounts, per-customer limits and B2B checkout rules. Slack's 2025 rate-limit change gives Marketplace-approved apps a structural moat. These form a cluster of narrow, quickly buildable add-ons.

### Cited Findings

**Shopify: the Stocky sunset (strongest evidence)**
- Shopify confirmed that Stocky (its free inventory/purchase-order app) would fully shut down on 31 Aug 2026, and its API shut down with it — [Starshipit](https://starshipit.com/blog-content/stocky-shutting-down); [Shopify Community](https://community.shopify.com/t/stocky-shuts-down-in-august-what-are-you-actually-moving-to-for-reorder-pos/637085)
- Merchants say there is no clean drop-in native replacement. One post says the native replacement "drops the parts I cared about most, reorder suggestions and purchase orders". Another lists lost features: PO exports, stocktakes, invoice paid/unpaid status and invoice due dates — [Shopify Community](https://community.shopify.com/t/with-stocky-shutting-down-i-ve-been-trying-to-figure-out-what-to-use-instead/673369); [Shopify Community thread list](https://community.shopify.com/t/stocky-replacement/621332)
- In the "What workflow are you most concerned about replacing?" thread (Aug–Sep 2026), merchants named these unmet workflows: receiving partial or short/damaged deliveries; reconciling ordered → invoiced → received → final cost; **dated cost history** ("Shopify keeps one cost per variant — the last one you paid", so past margins change); supplier records and lead times; shelf replenishment with per-location min/target levels ("Fill Shelves"); stocktakes and cycle counts — [Shopify Community](https://community.shopify.com/t/stocky-is-ending-what-workflow-are-you-most-concerned-about-replacing/672546)
- Complaints about alternatives in the same thread: most cover purchasing but leave receiving "far less covered"; most treat receiving as "tap the quantity, done"; native POs take "several times longer than Stocky did" for high SKU counts; Provido does not record invoices or per-delivery costs — [Shopify Community](https://community.shopify.com/t/stocky-is-ending-what-workflow-are-you-most-concerned-about-replacing/672546)
- Native data limits merchants cite: inventory adjustment history covers only 180 days and is viewable one variant at a time; the activity log is view-only and capped at 250 results; Stocky supplier records could not be exported — [Shopify Community](https://community.shopify.com/t/stocky-is-ending-what-workflow-are-you-most-concerned-about-replacing/672546)
- Competing apps and stated pricing: ShelfSprint $12–49/mo with a 30-day trial; Restock Forecast free up to 50 products, then $19.99/mo; Provido has a free plan; others (Binly, BuyAhead, Easify, EZstock, Replenly, Starshipit WMS) had no price stated — [Shopify Community](https://community.shopify.com/t/stocky-is-ending-what-workflow-are-you-most-concerned-about-replacing/672546); [Starshipit](https://starshipit.com/stocky-alternative); [Product Hunt (EZstock)](https://www.producthunt.com/p/ezstock-inventory-purchase-orders/shopify-is-shutting-down-stocky-here-s-what-that-means-for-merchants)
- At least one solo developer (Vlad Gerasimchuk, five Shopify apps built solo) launched a Stocky replacement. Competition for the generic PO tool is therefore already heavy — [Product Hunt](https://www.producthunt.com/p/self-promotion/shopify-is-killing-stocky-on-august-31st-i-built-the-replacement-launching-on-ph-tomorrow); [Indie Hackers profile](https://www.indiehackers.com/VladGerasimchuk)

**Shopify: Scripts deprecation**
- Shopify Scripts could no longer be edited or published from Apr 15, 2026 and stopped executing on Jun 30, 2026. The deadline had earlier been extended from Aug 28, 2025 — [Shopify changelog](https://shopify.dev/changelog/shopify-scripts-will-be-deprecated-on-june-30-2026); [Shopify Help](https://help.shopify.com/en/manual/checkout-settings/script-editor/migrating)
- Merchants report trouble replacing these use cases (thread from Jun–Nov 2026):
  - tiered or spend-threshold discounts (native discounts allow one minimum each)
  - per-customer repeat-use limits ("3 uses per customer", once every 30 days)
  - shipping rates that depend on product combinations, and payment/shipping hiding
  - B2B rules: tag-based wholesale pricing with rounding, order limits, buyer eligibility, PO validation and credit-limit checks
  - logic that needs order history or external APIs (Functions only see the current cart)
  — [Shopify Community](https://community.shopify.com/t/shopify-scripts-are-ending-what-is-everyone-using-now/632089)
- Constraints raised: automatic discounts are capped at 25 (apps included); custom Functions require Shopify Plus; Scripts that stop silently "usually mean full-price checkouts" — [Shopify Community](https://community.shopify.com/t/shopify-scripts-are-ending-what-is-everyone-using-now/632089)
- The space is crowded. Apps named include Checkout Boost, Functions Creator, Discount Spark, BOGOS, Discount Ninja, Kite, Scriptly, Regios, Flowly, SMART Functions Creator, Sellrova (free) and Section Store ($15/mo flat). Most replies come from app developers promoting their own apps — [Shopify Community](https://community.shopify.com/t/shopify-scripts-are-ending-what-is-everyone-using-now/632089)
- A separate change cited in the thread (unverified against an official source): the "Additional Scripts" field was removed on Aug 26, which broke tracking tags on non-Plus stores — [Shopify Community](https://community.shopify.com/t/shopify-scripts-are-ending-what-is-everyone-using-now/632089)

**Slack: a moat for Marketplace-listed apps**
- From May 29, 2025, commercially distributed Slack apps that are *not* in the Marketplace are limited to 1 request/minute and 15 objects per call on `conversations.history` and `conversations.replies`. This applies to new apps and new installs. Marketplace apps and internal apps are unaffected; custom apps keep 50+ req/min and 1,000 objects — [Slack changelog](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps)
- One search snippet suggested existing installs of unlisted apps would also be affected from Mar 3, 2026. I could not confirm this; the official page I fetched says existing installs are unaffected — [Slack FAQ](https://api.slack.com/changelog/2025-05-terms-rate-limit-update-and-faq); [DEV Community commentary](https://dev.to/helen_mireille_47b02db70c/slack-just-throttled-your-openclaw-agent-you-probably-havent-noticed-yet-d4)

**Airtable**
- A community thread complains that a pricing change removed multi-source sync from the Pro plan "with practically no notice". The date was not visible, so it is unverified — [Airtable Community](https://community.airtable.com/other-questions-13/new-pricing-takes-away-multi-source-syncing-18775)
- Airtable lists "no upcoming deprecations" for its API — [Airtable Support](https://support.airtable.com/docs/airtable-api-deprecation-guidelines)

### Concrete idea shortlist (synthesis; evidence strength noted)

| # | Platform | Gap | Existing apps / pricing | Demand evidence | Twist | Fees | MVP effort | Time to first revenue |
|---|---|---|---|---|---|---|---|---|
| 1 | Shopify | **Receiving & landed-cost ledger** after Stocky: partial/short/damaged receipts, invoice-vs-received reconciliation, per-delivery cost | Generic PO apps ($0–49/mo) cover purchasing, not receiving | Stocky threads above (strong) | Do *only* receiving and cost; works alongside any PO app | 0% on first $1M lifetime, then 15% | 3–5 wks | 4–8 wks (inferred) |
| 2 | Shopify | **Dated cost history / true margin over time** (Shopify keeps only the last cost per variant) | None found focused on this | stockroom_eu quote (moderate) | Snapshot cost on every receipt; historical margin reports | same | 2–3 wks | 3–6 wks |
| 3 | Shopify | **Inventory audit-log exporter** (native: 180 days, one variant at a time, 250-row log cap) | Unnamed backup app mentioned | Ian_Chechin post (moderate) | Continuous webhook archive plus CSV/Sheets export; cheap flat fee | same | 1–2 wks | 2–4 wks |
| 4 | Shopify (POS / multi-location) | **Shelf replenishment / back-room → floor** min/target per location | ShelfSprint $12–49/mo | codeofsagar post (weak–moderate) | Mobile pick list for retail staff | same | 3–4 wks | 4–8 wks |
| 5 | Shopify | **Supplier & lead-time directory + reorder** using stock cover × lead time | BuyAhead, Restock Forecast ($19.99/mo) | Arkadas_Kilic, Resat_y (moderate) | Bundle with idea 1 instead of shipping separately | same | 2–3 wks | — |
| 6 | Shopify (non-Plus) | **Tiered spend-threshold + per-customer usage-limit discounts** via Functions | Many (Kite, Discount Ninja, BOGOS, $15/mo Section Store, free Sellrova) | Scripts thread (strong demand, crowded) | Narrow on "uses per customer / per period", which native and most apps lack | same | 2–4 wks | 4–8 wks; hard to rank |
| 7 | Shopify Plus / B2B | **B2B checkout validation**: order min/max, PO-number format, buyer eligibility, credit limit | Scriptly, Regios (prices n/a) | Termguard / Denyslg posts | Plus merchants pay more; one-click templates | same | 3–5 wks | 6–10 wks |
| 8 | Slack | **Marketplace-listed app needing message history** (thread digests, channel export, knowledge search, standup rollups) | Many unlisted bots now throttled | Rate-limit change (structural) | Moat = Marketplace approval: unlisted rivals get 1 req/min × 15 msgs | Slack charges nothing for listing; you bill directly | 3–6 wks + several weeks of review | 2–3 months (review plus the 10-install gate) |
| 9 | QuickBooks Online | **Data-in tools** (bulk bill/expense/journal import from CSV, Shopify, Stripe), designed around unmetered "Core" calls | n/a (not researched) | Pricing change favours write-heavy apps (inferred) | Stay inside the free Builder tier (500k CorePlus calls/mo) | Intuit takes no listing rev share in these sources; API metering above the free tier | 3–5 wks | 6–10 wks. **Flag: accounting-adjacent; avoid tax/compliance claims** |
| 10 | Atlassian (Jira/Confluence Cloud) | **Forge port of a Data Center-only utility** for customers forced to Cloud by the DC end of life | Not researched per app | DC sales to new customers ended Mar 30, 2026; DC EOL Mar 28, 2029 | Pick a DC app with no Cloud equivalent; migration plus parity | 0% on first $1M lifetime on Forge; 16–17% from 2026 | 4–8 wks | 2–3 months (Atlassian buyers are slow) |
| 11 | Google Workspace | **Sheets/Gmail add-on designed to avoid restricted scopes** (use `drive.file` etc.) so no annual CASA fee | Not researched | Weak (no demand evidence gathered) | 0% fee; Stripe directly | No rev share; Google processes no payments; CASA Tier 2 about $540–675/yr per app if restricted scopes are used | 2–4 wks | 4–8 wks |
| 12 | Airtable | **Multi-source sync into one table** for Pro users who lost it | Not researched (Whalesync, Softr-type tools exist) | One forum thread (weak; date unverified) | Cheap flat-fee sync | Airtable has no paid marketplace (not verified) | 3–4 wks | 4–8 wks |
| 13 | monday.com | Any narrow utility; strongest pull is the economics (0% until $200k lifetime) | Not researched | None gathered | — | 0% until $200k lifetime revenue, then 15% | — | — |

### Inferences
- The Stocky gap is most defensible in **receiving + cost history** (ideas 1–3), because the generic "Stocky replacement" PO tool already has 8+ competitors. A narrow tool that complements whatever PO app a merchant picks avoids head-on competition.
- The Scripts-replacement discount category has real demand but is saturated. Only a very narrow wedge (per-customer usage limits, B2B validation) looks winnable for a solo developer.
- Slack's change turns Marketplace approval into a moat. That is attractive, but the 10-install gate and multi-week review push first revenue past "weeks". It fits as a second app, not the first.
- Deadline-driven demand (Stocky on Aug 31, Scripts on Jun 30) has already peaked by Nov 2026. Remaining demand comes from merchants who patched things in a hurry and are now unhappy with their stopgap, which is consistent with the Sep 2026 complaints.

### Gaps
- I did not pull App Store listing pages, so per-app install counts, star ratings, review counts and last-updated dates were not verified. The founder should check the top 5 apps for "purchase orders", "receiving", "tiered discount" and "B2B checkout" before committing.
- No evidence was gathered for Notion, ClickUp, Webflow, Squarespace, Etsy/eBay, Intercom, Zoom or Stripe Apps.
- Whether Shopify extended the Scripts or Stocky deadlines after the fact was not confirmed.

---

## Q2. Which native features were recently removed, deprecated or priced up?

### Takeaway
Major 2025–2026 removals that created gaps: Shopify Stocky (Aug 31, 2026), Shopify Scripts (Jun 30, 2026), Shopify's Additional Scripts field (unverified), Slack history-API throttling for unlisted apps (May 2025), QuickBooks API metering (Nov 2025), Atlassian Data Center end of life (sales ended Mar 2026), and Airtable Pro multi-source sync (date unverified).

### Cited Findings
- Stocky: shut down Aug 31, 2026, API included — [Starshipit](https://starshipit.com/blog-content/stocky-shutting-down); [MRPeasy](https://www.mrpeasy.com/blog/stocky-sunset/)
- Shopify Scripts: editing ended Apr 15, 2026; execution ended Jun 30, 2026 — [Shopify changelog](https://shopify.dev/changelog/shopify-scripts-will-be-deprecated-on-june-30-2026)
- Slack: 1 req/min and 15 objects on history/replies for non-Marketplace commercial apps (new apps and new installs from May 29, 2025); updated API terms applied to older apps from Jun 30, 2025 — [Slack changelog](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps)
- QuickBooks: the Intuit App Partner Program launched Jul 28, 2025 with Builder/Silver/Gold/Platinum tiers.
  - "Core" (data-in) calls are unmetered; "CorePlus" (data-out) calls are metered.
  - Builder is free with 500k CorePlus calls/mo, and calls beyond that are blocked.
  - Variable fees were waived until Oct 31, 2025 — [Intuit FAQ](https://developer.intuit.com/app/developer/qbo/docs/get-started/partner-faq); [Apideck](https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program)
  - Silver tier: $300/mo, 1M credits, $3.50 per 1k overage (third-party figure) — [Apideck](https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program)
- Atlassian Data Center: new subscriptions and Marketplace apps stopped for new customers Mar 30, 2026; existing customers can buy until Mar 30, 2028; end of life Mar 28, 2029 (Bitbucket DC exempt) — [Atlassian blog](https://www.atlassian.com/blog/developer/from-data-center-to-cloud-the-next-chapter-for-marketplace-apps)
- Airtable: multi-source sync removed from Pro (date not shown) — [Airtable Community](https://community.airtable.com/other-questions-13/new-pricing-takes-away-multi-source-syncing-18775)

### Inferences
- QuickBooks metering penalises read-heavy apps (reporting/dashboards) and spares write-heavy ones. A solo developer should build tools that push data *into* QBO.
- Atlassian's DC end of life will push many DC-only app customers to Cloud through 2028–2029, a multi-year migration wave.

### Gaps
- I did not research HubSpot, Zoom, Etsy, eBay or Google API deprecations.

---

## Q3. What revenue have indie developers reported from marketplace apps?

### Takeaway
Self-reported Shopify results range from near zero (PreloaderX at about $30 MRR in 2025) through $6.5k MRR (sold for $250k) up to $125k MRR (Zigpoll, solo). Large outcomes exist, but the median indie app is small. I found no reliable 2024–2026 figures for Slack, Atlassian or Google Workspace indie apps.

### Cited Findings
- Zigpoll: solo founder reported $125k MRR; the Shopify App Store is the single biggest channel at about one third of new signups — [Indie Hackers](https://www.indiehackers.com/post/c4o2Tfs6mjdpip5yZhaO)
- Kaching Appz: a Shopify app scaled to $6.5k MRR and sold for $250k; the founder's next app is at six-figure MRR — [Indie Hackers](https://www.indiehackers.com/post/qdReVAgLjz6EpW4OrJSI) (attribution per search summary)
- PreloaderX (Aug 2025): solo developer at about $30 MRR aiming for $1k, asking for help with reviews and traffic beyond the App Store — [Indie Hackers](https://www.indiehackers.com/post/just-pushed-a-major-update-to-my-shopify-app-would-love-your-feedback-pmd5pFLNkqrtdZxZorga)
- Older Shopify cases (2020–2021): WideBundle at $25k MRR within a year; one solo developer at $100k/mo from 4 apps (a commenter called it an extreme outlier) — [Indie Hackers](https://www.indiehackers.com/post/i-bootstrapped-a-shopify-app-to-25k-mrr-in-less-than-a-year-ama-89f3d4c471); [Indie Hackers](https://www.indiehackers.com/post/100k-mo-from-4-shopify-apps-solo-not-me-9ab6034f5c)
- Shopify app at $78k CAD MRR after 3 years (date not verified) — [Indie Hackers](https://www.indiehackers.com/post/i-bootstrapped-a-shopify-app-to-78k-cad-mrr-in-3-years-ask-me-anything-5fbbc2b886)

### Inferences
- $1–10k MRR from a single Shopify app is plausible but not guaranteed. Reviews and App Store ranking are the main bottleneck (PreloaderX).

### Gaps
- No verified 2024–2026 indie revenue posts for Slack, Atlassian, Google Workspace, monday.com or HubSpot apps. All figures above are self-reported.

---

## Q4. Marketplace fee structures and approval hurdles in 2025–2026

### Takeaway
Most marketplaces now charge nothing on early revenue: Shopify (0% on the first $1M lifetime from 2025), Atlassian Forge (0% on the first $1M lifetime) and monday.com (0% until $200k lifetime). Google Workspace and Slack take no cut because the developer bills directly. The real costs are approval friction: Slack needs 10 installs plus a review taking weeks; HubSpot needs 3 installs plus a 10-business-day review; Google charges an annual CASA fee for restricted scopes; QuickBooks has API metering.

### Cited Findings
- **Shopify:** 0% on the first $1M of *lifetime* revenue (counted from Jan 1, 2025; previously reset annually), then 15%. Developers above $20M or companies above $100M pay 15% on everything. Calculated on gross across all of a developer's apps. Terms effective Jun 16, 2025 — [Shopify docs](https://shopify.dev/docs/apps/launch/distribution/revenue-share); [Shopify changelog](https://shopify.dev/changelog/update-to-shopifys-app-developer-revenue-share)
- **Atlassian:** Forge apps get 0% on the first $1M lifetime revenue. The standard Forge rate rises from 15% to 16% (Apr 1, 2026) and then 17% (Oct 1, 2026), per the extended timeline that superseded the Jan/Jul 2026 dates — [Atlassian blog](https://www.atlassian.com/blog/developer/extended-timelines-for-marketplace-revenue-share-changes); [Atlassian 2026 update](https://www.atlassian.com/blog/developer/updates-to-marketplace-revenue-share-2026)
- **monday.com:** 0% until $200k lifetime revenue, then 15%. This started Sep 1, 2024. Apps sold through monday's Sales Order program pay 35% — [monday developer docs](https://developer.monday.com/apps/docs/subscriptions-payments-and-billing); [Sales Order terms](https://monday.com/l/uncategorized/marketplace-so)
- **Slack:** no fee for Marketplace inclusion; the developer bills directly. Listing requires at least 10 active-workspace installs (reconfirmed in a Sep 2026 changelog; a May 2026 blog said 5, likely a temporary threshold), a demo video of install/OAuth/uninstall, and a review that takes "at least a few weeks". Coded workflows are ineligible — [Slack changelog](https://docs.slack.dev/changelog/2026/09/01/slack-marketplace-install-requirement); [Slack review guide](https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide); [Slack rate-limit changelog](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps)
- **Google Workspace Marketplace:** Google does not process payments and the developer charges users directly (no rev share was found in the terms). Apps requesting restricted scopes need an annual CASA security assessment paid by the developer; about $540/yr for Tier 2 via TAC Security (2024 report) and about $675 per app (May 2026 forum estimate). Using non-restricted scopes can avoid it — [Workspace Marketplace terms](https://workspace.google.com/terms/marketplace/devtos); [Google Cloud help](https://support.google.com/cloud/answer/13465431); [Apps Script community](https://groups.google.com/g/google-apps-script-community/c/wlibwqM0hlg)
- **HubSpot:** listing requires at least 3 active unique installs, OAuth-only auth and a single use case, with manual review completed within 10 business days. Certification (optional, renewed every 2 years) requires a >95% success rate, a security questionnaire and an uninstall demo video. Rev share was not found — [HubSpot listing requirements](https://developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/app-marketplace-listing-requirements); [HubSpot certification](https://developers.hubspot.com/docs/apps/developer-platform/list-apps/apply-for-certification/certification-requirements)
- **QuickBooks / Intuit:** a free Builder tier (500k metered CorePlus calls/mo); paid tiers from about $300/mo (third-party figure); Core (data-in) calls unmetered — [Intuit FAQ](https://developer.intuit.com/app/developer/qbo/docs/get-started/partner-faq); [Apideck](https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program)
- **Zendesk:** paid apps are billed through the developer's own Stripe account connected to Zendesk. Stripe Tax applies automatically to new paid-app transactions from Dec 8, 2025. Unpaid invoices disable the app. The split percentage was not found — [Zendesk docs](https://developer.zendesk.com/documentation/marketplace/publishing-to-the-marketplace/set-up-paid-app-or-theme/); [Zendesk announcement](https://support.zendesk.com/hc/en-us/articles/10017083833370-Announcing-Stripe-Tax-support-for-third-party-developers-in-Zendesk-Marketplace)
- **Freshworks** (reference point): 80/20 split — [Freshworks](https://developers.freshworks.com/docs/getting-started/paid-apps-program/)

### Inferences
- For "first revenue in weeks", Shopify has the lowest friction: billing API, no install minimum and 0% fees. HubSpot is moderate (3 installs). Slack and Atlassian take longer. All fit the under-$100/mo budget except Google restricted-scope apps (CASA about $540–675/yr) and QuickBooks paid tiers.

### Gaps
- Revenue shares for HubSpot, Zendesk, Stripe Apps, Zoom, ClickUp, Notion, Webflow, Squarespace and Intercom were not found or not researched.
- Shopify App Store review times were not researched.
