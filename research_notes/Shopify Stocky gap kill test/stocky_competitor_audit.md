# Shopify post-Stocky gap kill test: receiving, invoice reconciliation, dated cost history, audit-log export

Research date: 2026-11-24. Sources are App Store listings, Shopify changelog/help pages, and Shopify Community threads. Community fetches were rate-limited (HTTP 429) late in the session, so two relevant threads could not be read in full (listed in Gaps). Unless noted, review counts and ratings below are as of 2026-11-24.

## Q1. Competitor landscape and feature matrix (top apps for Stocky replacement, POs, receiving, cost history, audit log)

### Takeaway
At least 10 apps now cover pieces of the proposed product, and most launched in June–Aug 2026. Only one has meaningful review volume and covers receiving: Stockroom by MyWorks (free, 71 reviews, 4.9). It does partial receiving and landed or weighted-average cost, but its listing doesn't mention a dated per-receipt cost history. Dated cost history (CostLedger), invoice checks (Binly) and long-term adjustment history (Inventory History Guardian, Adjustment Track) each exist as small apps with 0–8 reviews. No app is clearly dominant at "receiving + dated cost", but the space is crowded with near-identical solo-dev entrants.

### Feature matrix
Legend: Y = stated on listing or by developer; P = partial or claimed only in a dev forum post; N/S = not stated; ? = not verified.

| App | Reviews / rating | Launched | Price | (a) partial / short / damaged receiving | (b) invoice reconciliation | (c) dated cost history | (d) long-term adjustment history export |
|---|---|---|---|---|---|---|---|
| Stockroom (MyWorks) | 71 / 4.9 | 2026-07-03 | Free (other plans on site) | Y partial; damaged N/S | P (tracks "what you owe suppliers", QuickBooks sync, AP tag) | N/S (landed cost; weighted average written to cost per item) | N/S |
| Prediko | 269 / 4.9 | 2023-08-11 | Revenue-based, from about $49/mo | N/S | N/S | N/S | N/S |
| Binly (Prokop Studio) | 2 / 5.0 | 2026-06-16 | Free / $12 / $25 | Y partial; damaged N/S | Y "supplier invoice checks" | P (landed and weighted-average cost; no per-receipt history stated) | N/S |
| CostLedger (lcCode) | 0 reviews | 2026-06-18 | Free (50 SKUs) / $19 / $39 | N (manual or CSV receipts only) | P (PO PDF import with amount preview, Plus plan) | Y dated ledger and per-variant cost timeline; monthly COGS | P (ledger CSV export, Plus plan) |
| Restock Forecast (juhyun_han) | 0 reviews | ? | Free, then $19.99 per dev post | P scan receiving, partial deliveries (dev claim) | N/S | P "delivery-by-delivery cost history", receipt cost, margin (dev claim only) | N/S |
| Receive & Label: PO Receiving (WiredKits) | ? (offered 2026-11-20) | Nov 2026 | Free (3 POs/mo) / $15 | Y ordered / received / rejected qty per line per delivery, on native POs | N/S | P cost update from delivery (last cost or weighted average); history N/S | N/S |
| Purchase Order Hero (GhostApps) | 0 reviews | 2023-08-16 | $29 / $79 / $149 | P receive against PO; partial or damaged N/S | N/S | N/S | N/S |
| Inventory History Guardian (GhostApps) | 8 / 5.0 | 2024-08-01 | $19.99 / $39.99 / $99.99 | N/A | N/A | N/S | Y unlimited history, staff/app/reason attribution, CSV export |
| Adjustment Track (Next Half Apps) | 2 / 3.5 | 2026-07-08 | $19 / $49 / $99 | N/A | N/A | P (tracks price adjustments) | Y 3-year retention, Stocky CSV import; one review says CSV export doesn't work |
| Stockyard, EZstock, StockKit, Restockly, Stockie, Replen, Restockio, Sutler, Provido, BuyAhead, ShelfSprint | not verified | mostly 2026 | Stockyard free (3 POs/mo); EZstock free (5 POs/mo); Stockie POs need $59.99 plan | Stockyard Y partial; Restockly Y partial; StockKit and Replen barcode receiving | N/S | N/S (Provido explicitly does no receipt pricing or margin) | N/S |

### Cited Findings
- Stockroom: 4.9 from 71 reviews (94% five-star), launched 2026-07-03, Free, Built for Shopify. Listing says "Receive in full or in part at any location". Landed costs tracked at receiving, and a reviewer reports a weighted average that includes freight. Damaged items, cost history and audit log are not mentioned. — [Stockroom listing](https://apps.shopify.com/stock-room)
- Stockroom's receive flow can set Shopify cost per item to the new weighted average. — [MyWorks support doc](https://support.myworks.software/en/articles/15811678-receiving-inventory-against-a-purchase-order) (via search snippet; page not opened)
- Prediko: 4.9 from 269 reviews, launched 2023-08-11, revenue-based pricing. Listing covers 1-click auto POs and Stocky PO migration. Receiving, invoice and cost history aren't mentioned. — [Prediko listing](https://apps.shopify.com/prediko); about $49/mo starting price per [Prediko Stocky page](https://www.prediko.io/stocky-sunsetting) (via search snippet)
- Binly: 5.0 from 2 reviews, launched 2026-06-16, Free / $12 / $25. Lists "purchase orders with partial receiving", "landed and weighted-average cost", "supplier invoice checks", QuickBooks/Xero month-end files and Stocky CSV import. — [Binly listing](https://apps.shopify.com/binly)
- CostLedger: 0 reviews, launched 2026-06-18. Free (cost ledger and timeline, 50 SKUs), Pro $19 (30/60-day margins, monthly COGS, valuation, margin alerts, 500 SKUs), Plus $39 (Shopify PO PDF import and history, unlimited SKUs, CSV exports). Says it "never overwrites Shopify's Cost per item" and that "Reports are estimates, not a locked month-close journal." — [CostLedger listing](https://apps.shopify.com/costledger)
- Purchase Order Hero: 0 reviews, launched 2023-08-16, $29 / $79 / $149. Receive against PO with auto sync. No partial, damaged or cost-history features listed. — [PO Hero listing](https://apps.shopify.com/purchase-order-hero)
- Inventory History Guardian: 5.0 from 8 reviews, launched 2024-08-01, $19.99 / $39.99 / $99.99. Lists "unlimited history", staff/app/location/reason logging and CSV export. Reviews dated 2026-08-12 and 2026-08-19 describe weekly audits and investigating losses. — [IHG listing](https://apps.shopify.com/inventory-history-guardian)
- Adjustment Track: 3.5 from 2 reviews, launched 2026-07-08, $19 / $49 / $99, 3-year retention, Stocky CSV import, covers inventory and price adjustments. Review dated 2026-11-08: "so slow and cannot export in CSV file." — [Adjustment Track listing](https://apps.shopify.com/adjustment-track-1)
- Receive & Label (WiredKits), posted 2026-11-20: works on native POs. "Shows ordered, received and rejected quantities per line, per delivery." "Updates item cost from the delivery, last cost or weighted average, with a preview first." Prints receiver sheets and labels. Free for 3 POs/mo, Pro $15/mo. — [Community offer post](https://community.shopify.com/t/offer-receiver-sheets-labels-and-cost-updates-for-native-shopify-purchase-orders-free-plan/719217)
- Restock Forecast: listing shows a free plan and no reviews. The developer claims receiving with scan-to-add quantities, receipt cost, price write-back and margin (30-day trial, then $19.99/mo), and elsewhere "delivery-by-delivery cost history" plus freight and duty spread across lines. — [Restock Forecast listing](https://apps.shopify.com/lala-forecast); [dev post in PO improvements thread, 2026-09-21](https://community.shopify.com/t/subject-critical-improvements-required-for-shopify-purchase-orders-before-the-stocky-replacement-on-august-31-2026-updated-from-previous-post/647012?page=2); [dev profile](https://community.shopify.com/u/juhyun_han)
- Stockyard (partial receiving, free tier 3 POs/mo), EZstock (free tier 5 POs/mo, Stocky import), Restockly (partial deliveries, Stocky CSV import), StockKit (barcode receiving, Stocky CSV migration) and Stockie (POs on $59.99/mo plan) are summarized from search snippets. Their review counts were not verified. — [Stockyard](https://apps.shopify.com/stockyard), [EZstock](https://apps.shopify.com/ezstock), [Restockly](https://apps.shopify.com/restockly-4), [StockKit](https://apps.shopify.com/stockkit), [Stockie](https://apps.shopify.com/stockie), [506.io comparison](https://506.io/post/stocky-alternatives-compared)
- Procuro (Oaka AI) advertised cost updates on PO acceptance (weighted average, FIFO or replacement), but its listing now says "This app is not currently available on the Shopify App Store." — [Procuro listing](https://apps.shopify.com/po-manager)
- Bookkeep (an accounting app) tracks historical variant costs with effective dates. — [Bookkeep docs](https://www.bookkeep.com/docs/apps/shopify/limitations-of-shopify-cost-of-goods-sold) (via search snippet)

### Inferences
- Partial receiving (a) is commoditized. Native Shopify does it, and so do free Stockroom, Binly at $12, Stockyard, Restockly and Receive & Label at $15. Explicit damaged or rejected handling is rarer, but Receive & Label and native transfers both show rejected quantities.
- Invoice reconciliation (b) is barely addressed by name. Binly's "supplier invoice checks" is the only explicit claim, and Stockroom's AP/QuickBooks link is adjacent. This is the least crowded slice, but also the least clearly demanded (see Q4).
- A dated per-receipt cost history (c) is the most clearly open technical gap. Shopify keeps one cost per variant. The only dedicated app (CostLedger) has 0 reviews and doesn't do receiving. Restock Forecast claims it only in forum posts.
- Audit-log archiving (d) is already served. Inventory History Guardian has been live since 2024 with 8 five-star reviews and starts at $19.99. Adjustment Track adds 3-year retention. A new entrant would be third and pricier.
- Every relevant entrant priced at $0–25 entry level. A $29–49/mo bundle sits above Binly, CostLedger Pro, Receive & Label and Stockroom (free), with no review-backed incumbent to undercut.

### Gaps
- Review counts and ratings for EZstock, Stockyard, StockKit, Restockly, Replen, Restockio, ShelfSprint, Provido, BuyAhead, Sutler and Stockie were not verified (listings not opened).
- Established apps not checked for receiving or cost history: Inventory Planner, Cin7, Katana, Trunk, Fabrikator, Genie, Stock Sync. The Sumtracker listing URL returned 404.
- Restock Forecast's receiving and cost-history features are developer claims only. They are not on the listing.
- Stockroom's paid plans and any cost-history feature behind them were not checked on stockroom.app.

## Q2. What recent reviews (Sep–Nov 2026) complain about, especially receiving and cost tracking

### Takeaway
Recent App Store reviews are few and mostly positive. The only concrete complaints are PO-conversion bugs in Stockroom and slowness plus broken CSV export in Adjustment Track. No reviews were found complaining that an app lacks dated cost history. Reviews praise landed cost and unit-cost handling (Stockroom) as a buying reason.

### Cited Findings
- Stockroom, 2026-11-23 (EOS Fabrics): PO system "far superior to Shopify's inbuilt P.O.'s". Values adjusting unit costs from one place. — [Stockroom listing](https://apps.shopify.com/stock-room)
- Stockroom, 2026-10-18 (All Automation Australia): reports bugs converting or validating POs, and says a delivery address is required even for drop-ship. The developer replied 2026-10-19. — [Stockroom listing](https://apps.shopify.com/stock-room)
- Stockroom, 2026-10-08 (Garlands): "landed costs were the main reason" for choosing it. — [Stockroom listing](https://apps.shopify.com/stock-room)
- Adjustment Track, 2026-11-08 (Hijabistahub): "so slow and cannot export in CSV file." — [Adjustment Track listing](https://apps.shopify.com/adjustment-track-1)
- Binly, 2026-09-30 (Compline Wine Shop): praises scanning and search speed. — [Binly listing](https://apps.shopify.com/binly)
- Prediko, Oct–Nov 2026 reviews (3 visible): all positive about support and onboarding, with no receiving or cost complaints. — [Prediko listing](https://apps.shopify.com/prediko)

### Inferences
- Landed cost at receipt is a real buying trigger (Stockroom reviews). Merchants who care about cost seem to be getting it from Stockroom for free.
- Too few reviews exist on the small apps to see a pattern of unmet cost-history demand.

### Gaps
- Low-star review texts for Prediko (5 reviews at 1–3 stars) were not visible.
- Reviews for Inventory Planner, Cin7, Katana and Sumtracker were not checked.

## Q3. Has Shopify shipped native receiving, cost history or longer history improvements since Stocky?

### Takeaway
Shopify shipped native partial receiving (June 2026: PO → transfer with multiple shipments, linked to the PO) and PO analytics (Oct 6, 2026: cost reports, accepted and rejected quantities, weighted average supplier unit cost). It has NOT shipped per-receipt cost history, automatic cost-per-item write-back on receipt, or longer adjustment-history retention, as far as could be found.

### Cited Findings
- Changelog, 2026-06-22: receiving a PO now creates a transfer. "A single transfer can have multiple shipments, so shipments that arrive separately, are tracked separately." "Each transfer stays linked to its purchase order, so what was ordered, what arrived and what it cost, are all connected." The post also adds CSV import of PO lines and autofill from previous purchase price or cost per item. Damaged items, reconciliation and cost write-back are not mentioned. — [Shopify Changelog](https://changelog.shopify.com/posts/purchase-orders-now-create-transfers-to-move-inventory)
- Help Center: after a PO is marked Ordered, you create a transfer to "track shipments, receive inventory, and add cost adjustments". The page does not explain cost history or how cost per item is updated. — [Shopify Help: Purchase orders](https://help.shopify.com/en/manual/products/inventory/purchase-orders)
- On 6 Oct 2026, Shopify reportedly added PO data to Analytics: three default reports, custom PO fields, a PO overview, a transfer report with shipped/received/accepted/rejected quantities, and a "weighted average supplier unit cost" metric. Cost reports are based on the PO line's cost × ordered qty, not received quantity, and are "not landed cost". This is a third-party summary; the cited changelog is [Analyze purchase orders in Shopify Analytics](https://changelog.shopify.com/posts/analyze-purchase-orders-in-shopify-analytics) (not opened). — [Neat Digital guide](https://neat.digital/blogs/blogs/shopify-purchase-order-reports-supplier-costs-receiving-guide-2026)
- Shopify holds one cost per variant. Overwriting it keeps no history, and past orders aren't restated. — [Bookkeep docs](https://www.bookkeep.com/docs/apps/shopify/limitations-of-shopify-cost-of-goods-sold)
- Per-product or per-variant adjustment history shows the most recent 180 days. The store activity log is view-only, not exportable and limited to 250 results. An "Inventory adjustment changes" report in Analytics exports to CSV but isn't backfilled. — [Shopify Help: adjustment history](https://help.shopify.com/en/manual/products/inventory/adjusting-inventory/adjustment-history); [Syncinventorybetweenstores blog](https://www.syncinventorybetweenstores.com/blog/shopify-stock-history-track-export-inventory-changes) (via search snippets)
- Merchants list "receiving cost edits not saving to the product" and "Margin % just sitting blank" as open native defects (2026-09-15). — [PO improvements thread p.2](https://community.shopify.com/t/subject-critical-improvements-required-for-shopify-purchase-orders-before-the-stocky-replacement-on-august-31-2026-updated-from-previous-post/647012?page=2)
- No changelog entry from Oct–Nov 2026 changing cost-per-item on receipt was found. One guide (Cogsy) says receiving doesn't change cost per item. — [Cogsy guide](https://cogsy.app/guides/shopify-cost-per-item/) (via search snippet)
- A vendor post says Shopify has said velocity-based reorder suggestions are "not coming in 2026" (secondhand, unverified). — [Community thread p.5, Sutler, 2026-11-23](https://community.shopify.com/t/stocky-shuts-down-in-august-what-are-you-actually-moving-to-for-reorder-pos/637085?page=5)

### Inferences
- Native coverage now handles "ordered vs received vs rejected" quantities and partial shipments. That erodes the receiving half of the idea, especially (a).
- The structural gap (one cost per variant, with no dated snapshot per receipt) remains unfixed natively. So does the 180-day / 250-row history limit, though the Analytics export partly mitigates it for merchants who export regularly.
- Shopify Editions Winter '27 (typically in December) could change this. That is not yet known.

### Gaps
- The Oct 6 analytics changelog was not opened directly. Its details come from a third-party guide.
- Whether native transfer receiving lets you edit the unit cost and write it to cost per item was not confirmed from a dated Shopify source. Sources conflict.

## Q4. Are merchants still complaining after the deadline, or has it settled?

### Takeaway
Threads are still active into late November 2026, but they're dominated by app developers pitching. In the main "what workflow worries you" thread, 8 of about 12 posters were vendors and only 3 were clearly merchants. Genuine merchant pain is visible around receiving accuracy, landed cost and ordered → invoiced → received → final cost reconciliation, but the volume is low and the audience is being saturated by solo-dev offers.

### Cited Findings
- "Stocky is ending. What workflow are you most concerned about replacing?" (Aug 25 – Sep 29, 2026): receiving (partial, short or damaged; reconciling to PO) is the most-cited concern, followed by cost history and data export. Eight posters disclosed building tools (Easify, stockroom_eu, Ian_Chechin backup app, Provido, Binly, BuyAhead, ShelfSprint, Restock Forecast). Merchant posters were Mustafa_Ali, salor_works and davidleon. salor_works (2026-09-01) specifically raised reconciling "ordered, invoiced, received, final cost". — [Community thread](https://community.shopify.com/t/stocky-is-ending-what-workflow-are-you-most-concerned-about-replacing/672546)
- "Critical Improvements Required for Shopify Purchase Orders…" p.2: posts from Sep 3–24, 2026 discuss cost history ("Shopify stores one Cost per item, so history dies unless you log it", by thriftoindia, who sells a $39 sheet) and per-receipt cost (Denyslg, the Binly dev). One merchant (vizuliiss, Sep 15) cited cost edits not saving and blank margin. No Shopify staff response. — [Thread p.2](https://community.shopify.com/t/subject-critical-improvements-required-for-shopify-purchase-orders-before-the-stocky-replacement-on-august-31-2026-updated-from-previous-post/647012?page=2)
- "Stocky shuts down in August. What are you actually moving to…" p.5: the latest posts (Nov 11, 21, 23, 2026) are two from the Sutler vendor plus ReorderMath. Stores reportedly land on native POs for simple setups, spreadsheets, or a paid PO app "where receiving or cost tracking mattered". — [Thread p.5](https://community.shopify.com/t/stocky-shuts-down-in-august-what-are-you-actually-moving-to-for-reorder-pos/637085?page=5)
- Other active post-Stocky cost threads (not fully read because of rate limiting): "How are you handling landed cost per unit once Stocky is gone?" (15+ posts), "Splitting freight into Cost per item after Stocky", "Feature Request: Landed Cost Field in PO Receiving Workflow" and "Feature Request: Add Cost/Price/Margin Display to PO Receiving". Search snippets say Shopify hadn't responded. — [Landed cost thread](https://community.shopify.com/t/how-are-you-handling-landed-cost-per-unit-once-stocky-is-gone/661708), [Freight split thread](https://community.shopify.com/t/splitting-freight-into-cost-per-item-after-stocky-by-quantity-or-by-value/691799), [Landed cost field FR](https://community.shopify.com/t/feature-request-landed-cost-field-in-purchase-order-receiving-workflow/650480), [Cost/margin on receiving FR](https://community.shopify.com/t/feature-request-add-cost-price-margin-display-to-purchase-order-receiving/587455)
- New receiving-focused offers keep appearing in Nov 2026 (Receive & Label, 2026-11-20). Related topics include a Stocky feature request (2026-11-21) and a request to print labels from POs (2026-11-18). — [Receive & Label post](https://community.shopify.com/t/offer-receiver-sheets-labels-and-cost-updates-for-native-shopify-purchase-orders-free-plan/719217)
- No r/shopify thread specifically about post-Stocky receiving cost surfaced in search.

### Inferences
- The conversation hasn't fully settled, but its centre of gravity has moved from "what do I switch to" to vendors competing for the same small set of threads. The signal-to-noise ratio for a new entrant doing cold community outreach is poor.
- Merchant pain around landed cost and cost write-back is the most recurring genuine theme. Pure "dated cost history" and "audit-log archiving" are raised mostly by vendors, not merchants.

### Gaps
- Full merchant/vendor breakdown and latest dates for the landed-cost and freight-split threads (429 errors).
- Reddit r/shopify coverage is thin. No Sep–Nov 2026 threads were found via search.

## Q5. Did Shopify extend the Stocky deadline or provide a migration tool?

### Takeaway
No extension found. Stocky ended 2026-08-31 (delisted 2026-02-02), and its APIs stopped 2026-09-01. Shopify gave read-only export access for "at least 90 days" after shutdown, which is roughly now (late Nov 2026). Suppliers could not be exported. There is no Shopify-built migration tool; third-party apps (EZstock, StockKit, Restockly, Adjustment Track, Prediko, PO Hero) offer Stocky CSV import.

### Cited Findings
- Delisted 2026-02-02; unavailable after 2026-08-31. — search snippet citing Shopify transition guidance, via [community search results](https://community.shopify.com/t/stocky-app-going-away-after-august-31-2026/587292)
- Stocky APIs stopped working 2026-09-01. — [Getsupremo](https://www.getsupremo.com/academy/what-replaces-stocky/) (via search snippet)
- Read-only export for "at least 90 days" after 31 Aug; supplier records were never exportable. — [Arkadas_Kilic post 2026-09-24](https://community.shopify.com/t/subject-critical-improvements-required-for-shopify-purchase-orders-before-the-stocky-replacement-on-august-31-2026-updated-from-previous-post/647012?page=2); [Sutler post 2026-11-23](https://community.shopify.com/t/stocky-shuts-down-in-august-what-are-you-actually-moving-to-for-reorder-pos/637085?page=5)
- Historical Stocky POs don't import into Shopify as past transactions. — [Stocky shutdown search summary / InventoryQuick](https://inventoryquick.com/blog/stocky-discontinued-best-alternatives-shopify) (vendor blog, via search snippet)
- No official extension was found in searches. — [506.io Stocky page](https://www.506.io/stocky) (via search snippet)

### Inferences
- The read-only export window is closing about now. A one-time "rescue your Stocky cost and adjustment history" hook has a few days or weeks of life at most, and several apps already offer Stocky CSV import.

### Gaps
- Shopify's own Stocky transition help page wasn't fetched, so the exact read-only end date isn't confirmed.

---

### VERDICT: NARROW (borderline KILL for the bundle as specified)

**Against the kill criteria:**
- *"2+ apps do receiving + dated cost well with solid reviews"*: **Not met strictly.** Stockroom (71 reviews, 4.9, free) does partial receiving and landed or weighted-average cost write-back, but its listing doesn't mention dated per-receipt history. No other app combining receiving with cost history has more than 2 reviews.
- *"Shopify fixed it natively"*: **Partly.** Native partial receiving, accepted/rejected quantities and PO cost analytics now exist (June and Oct 2026). One cost per variant and the 180-day / 250-row limits remain.

**By slice:**
- **(a) Partial, short or damaged receiving: closed.** It's native, plus free Stockroom, plus Binly ($12), Stockyard, Restockly and Receive & Label ($15, rejected quantities per delivery).
- **(b) Ordered → invoiced → received → final-cost reconciliation: thinly contested, weakly demanded.** Binly claims "supplier invoice checks". One merchant (salor_works) asked for exactly this. Otherwise, evidence of demand is vendor-driven.
- **(c) Dated per-receipt cost snapshot and historical margin: the only genuinely open slice,** but already claimed by CostLedger (free to $39, 0 reviews, no receiving) and Restock Forecast (dev claims). Merchant pain here shows up mainly as "landed cost into cost per item", which Stockroom serves free.
- **(d) Audit-log archiver: closed enough.** Inventory History Guardian (since 2024, 8 five-star reviews, from $19.99, unlimited history and CSV) and Adjustment Track (3-year retention).

**Recommendation:** Don't build the four-part bundle at $29–49. If pursued, narrow it to (c), positioned as a "receipt-dated cost ledger and margin restatement" that sits on top of native POs and Stockroom. Price it at or under about $19 (the market's entry point), and validate with 5–10 merchants before writing code. Specifically, test whether accountants or bookkeepers at stores with volatile supplier costs (FX-exposed importers, wine and spirits, apparel with freight/duty) will pay. Such stores already use Stockroom and Shopify Analytics, so the question is whether the residual pain is worth paying for. Given that CostLedger launched in June 2026 and has 0 reviews after 5 months, existing demand for exactly (c) looks weak. That's the strongest kill signal.

**Places to validate, if narrowing (observe or read only; no outreach was done):**
- [Landed cost per unit once Stocky is gone](https://community.shopify.com/t/how-are-you-handling-landed-cost-per-unit-once-stocky-is-gone/661708)
- [Splitting freight into Cost per item after Stocky](https://community.shopify.com/t/splitting-freight-into-cost-per-item-after-stocky-by-quantity-or-by-value/691799)
- [Feature Request: Cost/Price/Margin on PO receiving](https://community.shopify.com/t/feature-request-add-cost-price-margin-display-to-purchase-order-receiving/587455)
- [Critical Improvements for Shopify POs (cost edits not saving, blank margin)](https://community.shopify.com/t/subject-critical-improvements-required-for-shopify-purchase-orders-before-the-stocky-replacement-on-august-31-2026-updated-from-previous-post/647012?page=2)
- Merchant posters salor_works, vizuliiss, davidleon and Mustafa_Ali in [the workflow-concerns thread](https://community.shopify.com/t/stocky-is-ending-what-workflow-are-you-most-concerned-about-replacing/672546)

**Confidence:** Moderate on "(a) and (d) are closed" and "the space is vendor-saturated". Low to moderate on "(c) is open but low-demand", because CostLedger's 0 reviews could reflect poor distribution rather than absent demand.

**Not verified:**
- Review counts for about 11 smaller apps.
- Established suites (Inventory Planner, Cin7, Katana, Sumtracker, Trunk, Fabrikator, Genie, Stock Sync).
- Stockroom's paid tiers.
- Whether native receiving writes cost per item.
- The Oct 6 changelog text, read directly.
- Full contents of the landed-cost and freight threads (rate-limited).
- Reddit sentiment.
- Shopify's Winter '27 Editions (likely December), which could change the native picture.
