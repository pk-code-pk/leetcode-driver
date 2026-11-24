# New / Upcoming Mandatory Requirements (2025–2027) Creating Recurring SMB Paperwork — Solo-Dev Opportunities

Research date: 2026-11-24. Scope: non-healthcare, non-finance, non-legal-services requirements that force small businesses into a repeat-interval record or document a third party needs. Sources are mostly regulator pages plus law-firm/vendor summaries; vendor/law-firm claims are flagged where I could not confirm against primary text. About 25 search/fetch calls; many details (segment counts, competitor pricing) remain gaps.

Summary ranking for a solo founder (first revenue in weeks, $1–10k MRR, cold outreach, <$100/mo budget), best first:

1. CARB Clean Truck Check due-date and tester scheduling (testing goes to 4x/year in Oct 2027)
2. HFC leak-repair log for small HVAC-R contractors (EPA AIM Act ER&R, in force since Jan 1 2026; rule under reconsideration)
3. NJ lead-safe certificate tracker for landlords and lead evaluators (every 3 years or at tenant turnover)
4. Vape/ESD state-directory SKU checker for smoke shops (WI, HI, VA, NC now; TN Jan 1 2027; WV pending Mar 2027)
5. CA Delete Act DROP processing for small registered data brokers (every 45 days since Aug 1 2026; about 600 brokers on a public registry)
6. Washington Clean Buildings Tier 2 compliance kit (due July 1 2027, then every 5 years)
7. Packaging data register for US EPR annual reports (May 31 yearly; CA sales restriction Jan 1 2027) and EU PPWR declarations of conformity (from Aug 12 2026)
8. EU Cyber Resilience Act vulnerability-reporting clock for small device/software makers (reporting since Sept 11 2026; full obligations Dec 11 2027)
9. CA SB 1383 edible-food-recovery logs (recovery organizations track monthly pounds per generator; Tier 2 generators inspected since 2024)
10. FSMA 204 food traceability records (watch only: July 20 2028)
11. ADA Title II documents and web for small local governments (watch: April 26 2027 / April 26 2028)

Checked and deprioritized: EUDR, GPSR, EU Accessibility Act, MoCRA, OSHA heat rule, CA balcony inspections (SB 721/326), Corporate Transparency Act/BOI (see the last section).

---

## 1. CARB Clean Truck Check (California heavy-duty I/M): quarterly testing from Oct 2027

### Takeaway
California requires periodic emissions tests for heavy-duty vehicles, run by individually credentialed testers. Testing is twice a year now and rises to four times a year for OBD-equipped vehicles in October 2027. That creates a hard, repeating due date per vehicle, plus a workflow for mobile testers: scheduling, reminders, invoicing, and proof of compliance for each fleet customer. This is the cleanest "repeat interval + third party needs the record" match I found.

### Cited Findings
- CARB: "Beginning October 2027, on-board diagnostics (OBD) equipped vehicles will be required to undergo testing four times per year"; owners are told to refer to their CTC-VIS account for due dates — [CARB CTC compliance testing requirements](https://ww2.arb.ca.gov/clean-truck-check-emissions-compliance-testing-requirements)
- Date conflict: Overdrive (Jan 2024) said 4x/year starts April 1, 2027; CARB's current page says October 2027 — [Overdrive](https://www.overdriveonline.com/regulations/article/15661077/carb-sets-april-1-effective-date-for-smog-check-regulation); a 2026 vendor article also says October 2027 — [heavyvehicleinspection.com](https://heavyvehicleinspection.com/blog/post/carb-clean-truck-check-compliance-software)
- Non-OBD vehicles stay at 2x/year — [CARB CTC brochure (2023)](https://ww2.arb.ca.gov/sites/default/files/2023-08/CTC-Bifold-FINAL-Web.pdf); semi-annual requirements page — [CARB](https://ww2.arb.ca.gov/clean-truck-check-requirements-vehicles-subject-semi-annual-compliance)
- Testers must complete free CARB training, pass an exam and create a CTC-VIS tester account. Credentials last 2 years, and expired credentials block submissions. OBD results go to CARB only through the OBD device vendor; non-OBD forms are submitted in the tester's CTC-VIS account; each tester sees only their own results — [CARB credentialed tester overview](https://ww2.arb.ca.gov/clean-truck-check-credentialed-tester-overview); [CARB credentialed testers & devices](https://ww2.arb.ca.gov/our-work/programs/inspection-and-maintenance-program/clean-truck-check-credentialed-testers-testing)
- CARB publishes an optional public list of "Available for Hire Credentialed Testers" — [CARB Find a CTC tester](https://ww2.arb.ca.gov/findaCTCtester)
- There is also an annual vehicle compliance fee (2027 update page exists) — [CARB AVCF 2027](https://ww2.arb.ca.gov/annual-vehicle-compliance-fee-update-2027)
- Existing tools: telematics and ELD vendors already market CTC tracking (Zonar, HOS247), and at least one dedicated "CARB Clean Truck Check compliance software" exists — [Zonar](https://www.zonar.com/?p=36034); [HOS247](https://hos247.com/resources/carb/clean-truck-check/); [heavyvehicleinspection.com](https://heavyvehicleinspection.com/blog/post/carb-clean-truck-check-compliance-software)

### Inferences
- **Who must comply:** owners of heavy-duty vehicles (above 14,000 lb GVWR, per the program's general framing, not verified this session) operating in California, including out-of-state trucks. Small fleets and owner-operators are numerous and usually lack telematics suites.
- **What they produce and how often:** a passing test submitted by a credentialed tester for each vehicle, every 6 months, rising to every 3 months for OBD vehicles in Oct 2027. Doubling the frequency doubles the scheduling pain, so demand should build through 2027.
- **Wedge (two buyer options):**
  - (a) Independent mobile testers, who are reachable through CARB's public tester list. A solo tester juggling dozens of fleets needs route scheduling, automatic due-date reminders to customers, invoicing, and a per-fleet compliance PDF.
  - (b) Small fleets of 1–20 trucks: a simple due-date calendar per VIN, with SMS reminders and a one-click "book a tester".
  - Pricing could run $29–99/month for testers and a per-truck price for fleets.
- **MVP effort:** small, about 2–4 weeks: a VIN list, due-date logic, reminders, booking, invoices and a PDF. No need to touch CARB systems (results are submitted by OBD device vendors and testers).
- **Regulatory risk:** low. The product only schedules and keeps records, and never certifies or submits tests. The main risk is due-date logic drift if CARB changes the schedule, so tell users to confirm due dates in CTC-VIS.

### Gaps
- Number of credentialed testers and number of covered vehicles: not found.
- Exact quarterly start month (CARB says October 2027; older press said April 2027).
- Pricing of existing CTC-specific tools.
- Whether CTC-VIS exposes any export or API.

---

## 2. HFC leak-repair and recordkeeping (EPA AIM Act ER&R rule, 40 CFR 84 subpart C)

### Takeaway
Since Jan 1, 2026, owners, operators and technicians of HFC appliances with 15 lb or more of charge must follow leak-repair rules, with associated recordkeeping and chronic-leaker reporting. This is a direct analogue of the old CFC/HCFC Section 608 leak-rate logs, now extended to HFCs. A $29–89/month indie competitor (Ref LeakLog) already exists, which validates demand but also shows the space is being contested. Big caveat: on May 20, 2026 EPA said it will reconsider the rest of the 2024 ER&R rule, so the requirement could shrink.

### Cited Findings
- EPA fact sheet (Jan 2026): leak-repair requirements apply from Jan 1, 2026 to certain appliances with a charge of 15 lb or more containing HFCs or substitutes. Recordkeeping and reporting are at 40 CFR 84.106 — [EPA ER&R leak repair fact sheet](https://www.epa.gov/system/files/documents/2026-01/er-r-fact-sheet-leak-repair-2026-01-13_1.pdf)
- The rule applies to HFCs or substitutes with GWP above 53 — [Womble Bond Dickinson](https://www.womblebonddickinson.com/us/insights/energy/102mskj/keep-your-cool-epa-expands-requirements-to-address-leaks-of-climate-super-pollut)
- Chronic leakers: appliances of 15 lb or more leaking at least 125% of full charge in a calendar year must report, per 40 CFR 84.106(j) — [EPA fact sheet](https://www.epa.gov/system/files/documents/2026-01/er-r-fact-sheet-leak-repair-2026-01-13_1.pdf)
- Trade press: "New year, new refrigerant rules, no grace period" — [ACHR News](https://www.achrnews.com/blogs/17-opinions/post/165785-new-year-new-refrigerant-rules-no-grace-period); a BSI blog frames it as "federal regulators just expanded refrigerant oversight by 70%" — [BSI](https://bsigroup.com/en-US/insights-and-media/insights/blogs/federal-regulators-just-expanded-refrigerant-oversight-by-70)
- Reclaimed-refrigerant virgin-content cap: one firm dates it Jan 1, 2026, another Jan 1, 2027 (conflict) — [Baker Botts](https://www.bakerbotts.com/thought-leadership/publications/2026/february/new-year-new-deadlines-does-your-hvac-and-other-refrigerant-containing-equipment)
- May 20, 2026: EPA finalized Technology Transitions revisions (extended HFC-use deadlines) and *proposed* exempting road refrigerated transport from leak repair. EPA "will reconsider the rest of the 2024 rule in the future" and says AIM Act obligations "must be met unless and until Congress amends federal law" — [EPA news release](https://www.epa.gov/newsreleases/epa-cuts-biden-era-refrigerant-rules-saving-americans-over-24-billion-and-lowering); [Holland & Knight](https://www.hklaw.com/en/insights/publications/2026/05/epa-finalizes-changes-to-technology-transitions-provisions)
- Competitors: Ref LeakLog from $29/month (founder cites $29–89/month, 14-day trial) — [Software Advice](https://www.softwareadvice.com/product/561604-Ref-LeakLog/); [Indie Hackers](https://www.indiehackers.com/product/ref-leaklog). Trakref has custom pricing and no free version — [SafetyCulture roundup](https://safetyculture.com/apps/refrigerant-compliance-management-software). The same roundup lists Parasense and Accruent as enterprise options.
- An FMHero white paper is a compliance guide for contractors, technicians and owners (an existing vendor marketing to the segment) — [ACHR News / FMHero PDF](https://www.achrnews.com/ext/resources/2025/10-October/A-Compliance-Guide-for-Contractors-Technicians-and-Equipment-Owners-FMHero-White-Paper.pdf)

### Inferences
- **Who must comply:** owners and operators of commercial refrigeration and comfort cooling with 15 lb or more of HFC (supermarkets, restaurants with walk-ins, cold storage, rooftop units on mid-size buildings), plus the HVAC-R contractors who service them. Contractors are the practical buyer, because they create the record at each service visit and owners ask them for it.
- **What they produce and how often:** a leak-rate calculation each time refrigerant is added, repair and verification records, and annual chronic-leak reports. The exact repair windows and retention period are in 40 CFR 84.106, not verified here.
- **Wedge:** mobile-first per-technician logging that auto-calculates leak rate and timers. It produces an owner-facing "appliance compliance history" PDF, which is the third-party document. Integrate with or import from ServiceTitan / Housecall Pro job exports.
- **Reachability:** state HVAC contractor license lists, ACCA/RSES chapters, refrigeration wholesalers' counter staff, Facebook HVAC groups.
- **MVP effort:** 3–5 weeks: appliance registry, service events, leak-rate math, reminders, PDF.
- **Risk:**
  - Regulatory demand risk is high: EPA is actively reconsidering, so a rollback is plausible.
  - Product liability is moderate: wrong leak-rate math could expose customers to penalties. It stays a record-keeping tool as long as it does not certify compliance.
  - Competition already exists at the same price point.

### Gaps
- Number of affected appliances or contractors (EPA 608-certified technician counts not found).
- Final status of the 2026 ER&R reconsideration.
- Exact retention period.
- Whether California's CARB Refrigerant Management Program overlaps (not checked this session).

---

## 3. New Jersey lead-safe certification for rentals (P.L.2021 c.182, amended P.L.2024 c.74)

### Takeaway
NJ requires lead-based-paint inspections of most pre-1978 rental units every three years or at tenant turnover, whichever is first, unless a valid lead-safe certificate exists. Municipalities must keep up-to-date records of schedules, results and turnovers. Turnover-triggered recurrence, combined with a certificate that the town demands, is exactly the target pattern.

### Cited Findings
- Municipalities must inspect single-family, two-family and multiple rental dwellings for lead-based paint hazards every three years or upon tenant turnover. Owners may instead hire a certified lead evaluation contractor directly — [NJ DCA Lead-Based Paint Inspections](https://www.nj.gov/dca/codes/resources/leadpaint.shtml); [DCA guide for rental dwellings (PDF)](https://www.nj.gov/dca/divisions/codes/resources/pdfs/lead_based_paint_guide_rental_dwellings.pdf)
- Initial inspections were due by July 22, 2024 (2 years after the July 22, 2022 effective date) or at turnover if earlier — [DCA guide](https://www.nj.gov/dca/divisions/codes/resources/pdfs/lead_based_paint_guide_rental_dwellings.pdf)
- A turnover inspection resets the three-year clock. If a certificate has expired and turnover occurs, a new inspection is needed — [DCA webinar Q&A](https://www.nj.gov/dca/divisions/codes/resources/pdfs/All_Webinar_Questions_Fin.pdf)
- Conflict on certificate validity: DCA pages and N.J.A.C. 5:28A say certificates are valid 2 years, while P.L.2024 c.74 text says 3 years and extends the initial window from two to three years — [N.J.A.C. 5:28A](https://www.nj.gov/dca/codes/codreg/pdf_regs/njac_5_28A.pdf); [P.L.2024 c.74](https://pub.njleg.gov/Bills/2024/PL24/74_.HTM)
- Municipalities must "maintain a record of all dwellings subject to this Chapter which shall include up-to-date information on inspection schedules, inspection results, and tenant turnover" — [N.J.S.A. 52:27D-437.16](https://www.nj.gov/dca/codes/codreg/pdf_regs/njsa_52_27D_437_16__20.pdf)
- Local ordinances mirror the rule. Jersey City requires a copy of the valid lead-safe certificate to be furnished to its Housing Preservation Division — [Jersey City](https://jerseycitynj.gov/cityhall/housinganddevelopment/housingpreservation); example township ordinance — [ecode360](https://www.ecode360.com/41750879)

### Inferences
- **Who must comply:** NJ landlords of pre-1978 rental units (exemptions include units built after 1978 and certain certified units), the property managers who run them, about 560 municipalities that must track this, and DCA-certified lead evaluation contractors.
- **Wedge:** a certificate vault plus a turnover-triggered reminder ("tenant moving out → book lead inspection → upload certificate → auto-send to the town"). A second product for lead evaluators covers scheduling, report and certificate generation, and a client portal.
- **Reachability:** NJ landlord associations, county property-manager lists, and DCA's public list of certified lead evaluation contractors (exists per DCA; not fetched).
- **MVP effort:** about 2–3 weeks.
- **Risk:** low as long as the product only tracks and does not issue certificates. The need to configure the 2-year vs 3-year validity per jurisdiction shows why software helps.
- **Expansion:** other turnover- or interval-triggered lead registries (Rochester NY, Philadelphia, Maryland) were not verified this session.

### Gaps
- Number of covered NJ rental units.
- Whether the 3-year certificate term from P.L.2024 c.74 is now operative.
- Existing tools: none found specifically; municipal software vendors (e.g., rental-registration modules) likely cover the town side.

---

## 4. State vape/ESD product directories: SKU compliance for smoke shops

### Takeaway
A wave of state "directory" laws (2024–2027) bars retailers from selling any vapor product not listed in a state directory, with per-product penalties of $500–$5,000+. Directories change as products are added or removed, so retailers face a recurring "check my shelf against the list" workflow. A barcode-scan app that checks inventory against all state directories is a simple, data-heavy product.

### Cited Findings
- Wisconsin: unlisted hemp devices cannot be sold from July 2, 2026; from Sept 1, 2026 there is a $1,000 forfeiture per day per device for manufacturers and retailers — [WI DOR vape directory FAQ](https://www.revenue.wi.gov/Pages/FAQS/ise-vape-directory.aspx)
- Hawaii Act 190 (signed July 7, 2026): retailers must check the Directory. Penalties are $500 per product for a 1st violation and $750–$1,000 per product for a 2nd within 12 months — [Hawaii AG notice to retailers](https://ag.hawaii.gov/cjd/files/2026/07/Hawaii-Law-Notice-Letter-to-Retailers-7-13-26.pdf); [Hawaii AG](https://ag.hawaii.gov/cjd/?p=2231)
- Tennessee: from Jan 1, 2027, vapor products not in the directory cannot be sold at retail; unlisted products are subject to seizure and penalties — [TN DOR TOB-19](https://revenue.support.tn.gov/hc/en-us/articles/41939999495572-TOB-19-Manufacturers-Must-Register-Vapor-Products-Sold-in-this-State)
- Virginia: civil penalty of at least $5,000 per unlisted product offered for sale (first violation); unlisted products are contraband — [Va. Code 59.1-293.20](https://law.lis.virginia.gov/vacode/59.1-293.20)
- Pennsylvania AG maintains a directory of certified e-cigarettes — [PA AG](https://www.attorneygeneral.gov/?p=33298)
- North Carolina SL 2026-41 accelerates civil penalties for registry violations effective Oct 1, 2026. The summary's URL and content did not cleanly match, so treat as unverified — [NCGA summary](https://ncleg.gov/Legislation/SummariesPublication/Summary/2026/8/S257-SMSV-140(sl)-v-11/)
- West Virginia: SB 1000 / HB 5437 would bar retailers from selling unlisted products from March 1, 2027 (enactment not confirmed) — [WV ABCA notice](https://abca.wv.gov/media/32675/download); [WV SB1000 history](https://bills.wvlegislature.gov/bill/history/2026/RS/SB1000)

### Inferences
- **Who must comply:** licensed tobacco and vape retailers (smoke shops, convenience stores) in directory states. These are fragmented independents and reachable, because most states publish tobacco retailer license lists.
- **What they produce:** proof that every SKU on the shelf is listed, re-checked whenever directories update. Inspectors and AG enforcement are the third party.
- **Wedge:** aggregate state directories into one database, add a phone barcode scan, alerts when a product is delisted, and a printable "shelf audit" log dated per inspection. Price $19–49/month per store, or sell to distributors as a value-add.
- **MVP effort:** about 2–4 weeks, mostly the scraping and normalization of directories (PDF/CSV, varying formats) and the UPC mapping.
- **Risk:**
  - Moderate data-accuracy liability: a wrong "listed" result could cost a retailer $5,000 per SKU, so strong disclaimers and source links are needed.
  - Some payment processors restrict tobacco-adjacent merchants, though selling software to them is usually allowed (not verified).
  - Federal FDA enforcement on unauthorized vapes adds churn.
  - It is a record-keeping and lookup product, not certification.

### Gaps
- Full list of directory states and their effective dates (this was one search).
- Whether directories publish UPCs (critical for scan matching).
- Existing competitors (none surfaced).
- Retailer counts per state.

---

## 5. California Delete Act: DROP deletion processing for registered data brokers

### Takeaway
Since Aug 1, 2026, every California-registered data broker must access the state's Delete Request and Opt-out Platform (DROP) at least every 45 days, match hashed consumer identifiers against its records and process deletions. The buyer universe is small but perfectly enumerated (about 600 brokers on a public registry), the cadence is fixed, and enforcement has begun. A small number of customers at a few hundred dollars a month could reach the MRR target.

### Cited Findings
- Brokers must access DROP at least once every 45 days starting Aug 1, 2026 and process deletion requests (Cal. Civ. Code 1798.99.86(c)) — [CPPA data brokers / DROP](https://cppa.ca.gov/data_brokers); [CalPrivacy: processing DROP requests](https://privacy.ca.gov/drop-for-data-brokers/process-drop-requests/)
- Brokers match hashed requests to their records and delete matches — [CalPrivacy: How DROP deletions work](https://privacy.ca.gov/2026/07/drop-data-broker-deletions-how-do-they-work/). EPIC describes a 90-day processing window (the relation to the 45-day cadence is not explicitly reconciled) — [EPIC](https://epic.org/?p=48000)
- More than 600 registered data brokers were expected to start processing on Aug 1, 2026, and more than 500,000 Californians had submitted DROP requests by Aug 25, 2026 — [Governor's office, Aug 13 2026](https://www.gov.ca.gov/2026/08/13/icymi-california-takes-historic-action-against-data-brokers/); [CalPrivacy, June 2026](https://privacy.ca.gov/2026/06/privacy-momentum-builds-300000-californians-sign-up-for-drop-as-registered-data-brokers-hit-a-record-high/)
- First enforcement action under the CCPA and Delete Act was against an Iowa-based company — [Governor's office](https://www.gov.ca.gov/2026/08/13/icymi-california-takes-historic-action-against-data-brokers/)
- Enterprise privacy vendors are already marketing DROP support — [TrustArc](https://trustarc.com/resource/california-delete-act-drop-platform-data-brokers/)

### Inferences
- **Who must comply:** about 600 registered brokers, many of them small (people-search sites, list sellers, B2B contact-data shops). The registry is a ready-made cold-outreach list.
- **What they produce:** a download every 45 days, hash matching, a deletion log and a status report back to DROP. Audit evidence will matter later (independent audits start in 2028 per the statute; not verified this session).
- **Wedge:** a self-hosted or CLI-plus-dashboard tool. It pulls the DROP list, hashes the broker's own records locally (so no PII leaves the customer), produces the match/deletion log, and reminds before each 45-day window. Price $200–500/month.
- **MVP effort:** about 3–4 weeks, depending on DROP's API or file formats.
- **Risk:**
  - Moderate: privacy-compliance adjacent. Bugs mean missed deletions, so the product must never claim to "make you compliant".
  - Reputational: customers are data brokers.
  - Arguably close to the "legal" exclusion, though it is a workflow tool, not legal services.
  - Enterprise vendors (TrustArc, etc.) compete at the high end.

### Gaps
- DROP technical interface (API vs file download).
- Distribution of broker sizes.
- Pricing of existing DROP modules.
- Audit start date (2028 from memory; unverified).

---

## 6. Washington Clean Buildings Performance Standard: Tier 2 (due July 1, 2027)

### Takeaway
Owners of Washington buildings of 20,001–50,000 sq ft (and multifamily above 20,000 sq ft) must benchmark energy, run an operations and maintenance program, write an energy management plan, and report to Commerce by July 1, 2027, then every five years. There is a hard 2027 deadline with template-able documents and no performance target yet. Good for a deadline-driven kit sold to small property managers.

### Cited Findings
- Tier 2 covers buildings whose multifamily, nonresidential, hotel, motel and dormitory floor area exceeds 20,000 but not 50,000 gross sq ft (multifamily above 20,000 sq ft covered regardless). Owners must report compliance by July 1, 2027 and every five years after, through the Clean Buildings Portal. Requirements are benchmarking, an O&M program and an energy management plan. No performance target "at this time" — [WA Commerce Tier 2 compliance](https://www.commerce.wa.gov/cbps/tier-2-compliance/)
- A Tier 2 performance standard is expected around 2029 — [Pierce County](https://www.piercecountywa.gov/8816/Washington-Clean-Buildings-Performance-S)
- Law expansion background — [Commerce fact sheet](https://www.commerce.wa.gov/wp-content/uploads/2022/08/CBPS-009-Expanding-the-Clean-Buildings-Law-Fact-Sheet.pdf)
- A 2026 rulemaking notice (WSR 26-09-045) exists; its content was not reviewed — [WSR 26-09-045](https://lawfilesext.leg.wa.gov/law/wsrpdf/2026/09/26-09-045.pdf)

### Inferences
- **Who must comply:** small commercial and multifamily owners and their property managers in WA. Many have never done ENERGY STAR Portfolio Manager benchmarking.
- **What they produce:** a benchmark, a written O&M program (with ongoing task logs), an energy management plan, and a portal report. The O&M program implies recurring task records.
- **Wedge:** a guided wizard that pulls utility data into Portfolio Manager (which has a public web-services API), generates the EMP and O&M documents from templates, and runs a recurring O&M task checklist with logs. Sell per building at $300–600 one-time plus a small monthly fee for O&M logs, or white-label to small energy consultants.
- **Reachability:** Commerce's covered-building lists (Commerce notified owners; whether the list is public was not verified), BOMA/IREM Washington chapters, multifamily associations.
- **MVP effort:** 3–5 weeks.
- **Risk:** low to moderate. It is document generation plus logging; the owner submits. Seasonality: demand peaks before July 2027, then drops until the 5-year cycle and the 2029 targets.
- **Analogous:** many city benchmarking and building-performance laws (Denver, NYC LL97, etc.) were not reviewed here.

### Gaps
- Number of Tier 2 buildings (not found).
- Whether the covered-building list is public.
- Existing Tier 2 tools and consultant pricing.

---

## 7. Packaging compliance data: US state EPR annual reports and EU PPWR (Aug 12, 2026)

### Takeaway
Packaging EPR creates an annual, form-driven report: packaging supply data by material and weight, due May 31 in Oregon, Colorado and California. California adds a sales restriction from Jan 1, 2027 for producers not in an approved PRO plan. In the EU, PPWR (applicable Aug 12, 2026) requires a declaration of conformity backed by technical documentation per packaging type (scope disputed). The underlying need is a per-SKU packaging bill of materials, which small brands do not have. Small producers below the thresholds are exempt, so the buyer is a $1M–$50M consumer brand, often on Shopify.

### Cited Findings
- Thresholds: California exempts small producers under $1M CA gross sales (they must register or claim exemption); Oregon has a $5M de minimis threshold; Colorado uses an inflation-adjusted threshold (figure not found) — [Oregon DEQ RMA exemptions](https://www.oregon.gov/deq/recycling/Pages/RMA-Exemptions.aspx); [Proskauer EPR update](https://www.proskauer.com/alert/extended-producer-responsibility-packaging-law-update)
- Oregon and Colorado reports were due May 31, 2026, covering 2025 supply data — [Faegre Drinker](https://www.faegredrinker.com/zh/insights/publications/2026/5/extended-producer-responsibility-six-state-reports-due-may-31); [Venable](https://www.venable.com/insights/publications/2026/04/epr-deadlines-are-arriving-what-to-do-before)
- California regulations took effect May 1, 2026. From Jan 1, 2027 no producer may sell covered materials in CA unless participating in an approved PRO plan. Penalties are up to $50,000/day ($25,000/day for qualifying small entities) — [Sidley](https://environmentalhealthsafetybrief.sidley.com/2026/05/05/extended-producer-responsibility-deadlines-are-here-what-companies-complying-with-packaging-and-textile-epr-need-to-do-now/); [Holland & Knight](https://www.hklaw.com/en/insights/publications/2026/01/the-latest-pandoras-box-what-you-need-to-know-now-about-state-epr-laws)
- Annual May 31 cadence across CA/CO/OR (vendor guide, not primary) — [Repurpose Global](https://repurpose.global/blog/2026-epr-deadlines-complete-guide)
- EU PPWR applies from Aug 12, 2026. Several firms say every packaging type needs a DoC plus technical documentation (retained 5 years single-use, 10 years reusable). The UK FDF reads the DoC scope more narrowly (heavy metals, PFAS in food-contact packaging, reuse) — [Packaging Europe](https://www.packagingeurope.com/everything-you-need-to-know-about-the-ppwr-declaration-of-conformity/); [FDF PPWR guidance](https://www.fdf.org.uk/gd-gb/fdf/business-guidance-hubs/packaging/ppwr-business-guidance-page/); [White & Case](https://www.whitecase.com/insight-alert/application-packaging-and-packaging-waste-regulation-ppwr-further-practical-guidance)
- Packaging already on the EU market before Aug 12, 2026 can remain. Harmonized labelling depends on pending implementing acts — [Faegre Drinker](https://www.faegredrinker.com/en/insights/publications/2026/7/significant-new-obligations-for-manufacturers-placing-packaging-on-the-eu-market)
- No small-business simplified regime under PPWR was found in the sources searched — (same sources above)

### Inferences
- **Wedge:** a Shopify/CSV-import "packaging register": for each SKU, list the components (box, mailer, tape, insert) with material and weight, multiply by units shipped per state, and export in the CAA/state reporting format. Add a PPWR DoC/tech-file template generator for EU sellers. Price $49–149/month.
- **Reachability:** Shopify app store, packaging suppliers (EcoEnclose already publishes an EPR guide — [EcoEnclose](https://ecoenclose.com/resources/epr-packaging-requirements)), CPG founder communities.
- **MVP effort:** 4–6 weeks (data model plus state report formats).
- **Risk:**
  - Moderate: report accuracy feeds into fees, so position it as "data prep", with the producer filing through the PRO.
  - Thresholds exempt the smallest brands, which shrinks the "tiny SMB" market.
  - Competition from Circular Action Alliance's own portal and EPR consultancies (pricing not found).

### Gaps
- Colorado threshold.
- CAA reporting template and whether it already offers SKU-level tooling.
- Number of producers above thresholds.
- Existing SMB-priced EPR tools.

---

## 8. EU Cyber Resilience Act: vulnerability and incident reporting (since Sept 11, 2026; full Dec 11, 2027)

### Takeaway
Any manufacturer selling "products with digital elements" in the EU (including products already on the market) must now report actively exploited vulnerabilities and severe incidents through the CRA Single Reporting Platform. The main obligations, including SBOM and vulnerability-handling processes, arrive Dec 11, 2027. This is a workflow a technical solo founder understands. The buyer is a small hardware or software maker, but crowded security vendors and "compliance product" risk make it weaker for fast revenue.

### Cited Findings
- Manufacturers must report actively exploited vulnerabilities and severe incidents from Sept 11, 2026; main obligations apply from Dec 11, 2027 — [European Commission](https://commission.europa.eu/news-and-media/news/safer-and-more-secure-digital-products-2026-09-11_bg); [EC CRA reporting](https://digital-strategy.ec.europa.eu/en/policies/cra-reporting)
- Article 14 reporting covers products already on the market before Sept 11, 2026 — [Steptoe](https://www.steptoe.com/en/news-publications/international-compliance-blog/eu-cyber-resilience-acts-new-vulnerability-and-incident-reporting-requirements-for-products-with-digital-elements-entered-into-force.html)
- Only notifications submitted via the Single Reporting Platform satisfy the obligation — [Ireland NCSC](https://ncsc.gov.ie/cra/)
- Fines for reporting breaches are up to €15M or 2.5% of worldwide turnover — [CMS](https://cms.law/en/lux/legal-updates/ready-respond-report-the-cyber-resilience-act-s-reporting-regime-is-here)
- No SME carve-out from reporting was found in the sources searched — [CSA research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-cra-reporting-deadline-20260903-csa-sty/)

### Inferences
- **Wedge:** a "CRA incident clock" for small IoT and app makers: vulnerability intake (security.txt / inbox), timers for the staged early-warning, notification and final reports, draft report forms, and per-product SBOM and version registry ahead of Dec 2027. (The commonly cited 24h/72h/14-day staging is from general knowledge; not verified this session.) Price $49–199/month.
- **Reachability:** moderate. EU hardware startups, Shopify/Kickstarter device makers, open-source-commercial companies.
- **MVP effort:** 4–6 weeks.
- **Risk:** higher. It sits close to a regulated compliance product, a missed clock costs real fines, and SBOM/security incumbents (Snyk, Anchore, etc.) will bundle this. Better as a later expansion than a first product.

### Gaps
- SME-specific guidance.
- SRP technical interface.
- Count of affected small manufacturers.

---

## 9. California SB 1383 edible food recovery recordkeeping

### Takeaway
California requires Tier 1 food generators (since 2022) and Tier 2 (since Jan 1, 2024) to have written agreements with food recovery organizations and keep records. Recovery organizations must track pounds received monthly from each generator and report annually to jurisdictions, which inspect. The requirement is recurring and the records are demanded by third parties, but the natural buyers (food recovery nonprofits, cities) have small budgets or slow procurement.

### Cited Findings
- Tier 1 (supermarkets and grocery stores of 10,000+ sq ft, etc.) has been subject since 2022. Tier 2 (restaurants of 5,000+ sq ft, health facilities, hotels, etc.) since Jan 1, 2024 — [Glendale](https://glendaleca.gov/home/showpublisheddocument/70388/638556057695700000); [CalRecycle inspection checklist](https://www2.calrecycle.ca.gov/Docs/Web/126603)
- Generators must keep a list of recovery organizations with contracts or written agreements and copies of those agreements — [CalRecycle checklist](https://www2.calrecycle.ca.gov/Docs/Web/126603); [Carlsbad](https://carlsbadca.gov/home/showpublisheddocument/7919/637743873713830000)
- Recovery organizations track monthly pounds received from each generator and report annually to the jurisdiction — [Sacramento](https://cityofsacramento.gov/public-works/recycling-solid-waste/Commercialwasteservices/edible-food-recovery)
- Jurisdictions inspect generators' records — [CalRecycle FAQ](https://calrecycle.ca.gov/organics/slcp/faq/foodrecovery/); [Lakewood](https://www.lakewoodca.gov/Business/Trash-and-Recycling-for-Businesses/Edible-Food-Recovery-for-Businesses)

### Inferences
- **Wedge:** a pickup-logging app shared between generator and recovery organization (driver logs pounds at pickup, both sides get monthly totals, the organization's annual jurisdiction report is auto-generated). The generator pays; the recovery organization gets it free, which also drives distribution.
- **MVP effort:** about 2–3 weeks.
- **Risk:** low.
- **Weaknesses:**
  - Rules have been in place since 2022/2024, so it is not new.
  - Existing donation-logistics apps likely exist (Food Rescue US, Copia, Replate; not verified).
  - Enforcement intensity varies by city.

### Gaps
- Whether generators themselves must log pounds (Section 18991.4 not read).
- Competitor landscape and pricing.
- Number of Tier 1/2 generators.

---

## 10. FSMA 204 Food Traceability Rule (watch, July 20, 2028)

### Takeaway
Traceability recordkeeping (key data elements at critical tracking events, plus a sortable spreadsheet to FDA within 24 hours on request) is real recurring work for small distributors, grocers and processors, but enforcement has been pushed to July 20, 2028. It is too far out for "revenue in weeks" and is already crowded.

### Cited Findings
- The original compliance date was Jan 20, 2026. FDA proposed a 30-month extension to July 20, 2028 (Aug 2025) — [Federal Register 2025-14967](https://www.federalregister.gov/documents/2025/08/07/2025-14967/requirements-for-additional-traceability-records-for-certain-foods-compliance-date-extension)
- FDA's page says the 2026 continuing appropriations act directed FDA not to enforce the rule before July 20, 2028. The same page still calls the date "proposed" in places (inconsistent) — [FDA FSMA 204 page](https://fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods)
- Canada's CFIA treats July 20, 2028 as the compliance date — [CFIA](https://inspection.canada.ca/en/exporting-food-plants-animals/food-exports/notices/food-traceability-0); [NC State](https://foodbusiness.ces.ncsu.edu/news/fda-fsma-204-food-traceability-rule-july-20-2028/)

### Inferences
- Deprioritize for now. Revisit in 2027–2028 with a "24-hour FDA spreadsheet generator" for small distributors, if incumbents (ReposiTrak, FoodReady, Trustwell, etc., from memory) leave the low end open.

### Gaps
- Whether a final compliance-date rule was formally published.

---

## 11. ADA Title II web and document accessibility for small local governments (watch)

### Takeaway
DOJ's April 20, 2026 interim final rule pushed Title II WCAG 2.1 AA compliance to April 26, 2027 (entities serving 50,000+ people) and April 26, 2028 (smaller entities and special districts). The buyers are small towns, school districts and special districts, not small businesses. They have recurring document flows (agendas, minutes, PDFs) that must be accessible. Procurement is slow, and "certifying accessibility" carries liability.

### Cited Findings
- Interim final rule extending deadlines one year: April 26, 2027 for larger and April 26, 2028 for smaller governmental entities. Effective immediately; comments were due June 22, 2026 — [Federal Register 2026-07663](https://www.federalregister.gov/documents/2026/04/20/2026-07663/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web); [UNC SOG](https://canons.sog.unc.edu/blog/2026/04/20/deadlines-to-comply-with-ada-web-accessibility-requirements-extended-by-one-year/)
- One source says April 27, 2027 (date discrepancy) — [Ogletree](https://ogletree.com/insights-resources/blog-posts/dojs-extension-of-government-website-accessibility-guidelines-may-impact-private-sector-websites/)
- Underlying Title II obligations and private litigation risk remain — [Seyfarth ADA Title III blog](https://www.adatitleiii.com/2026/04/doj-extends-ada-title-ii-website-accessibility-deadlines-for-governmental-entities-but-litigation-and-compliance-risks-remain/)

### Inferences
- **Possible wedge:** an "accessible meeting packet" pipeline (agenda and minutes to tagged PDF/HTML) for small municipalities. It is recurring every meeting, but carries certification and liability risk and slow sales. Not a first product.

### Gaps
- Number of small entities.
- Price points they accept.

---

## Checked and deprioritized (and why)

### Takeaway
Several headline regulations fail the "recurring + small business + solo-serviceable" screen: their deadlines have passed, small firms are exempt or face only one-off filings, the field is saturated, or the rule is not final.

### Cited Findings
- **EUDR:**
  - General application moved to Dec 30, 2026; micro and small enterprises to June 30, 2027 for products not previously under EUTR — [EY](https://taxnews.ey.com/news/2026-0237-eu-deforestation-regulation-application-postponed-to-30-december-2026); [EC Green Forum](https://green-forum.ec.europa.eu/deforestation-regulation-implementation_en)
  - Micro and small primary operators submit a *one-off* simplified declaration with no duty to update, which removes the recurring element — [Jones Day](https://www.jonesday.com/en/insights/2025/12/eu-deforestation-regulation-amendments-deferred-timelines-and-simplification-measures); [Linklaters](https://sustainablefutures.linklaters.com/post/102ly55/eu-changes-to-deforestation-regulation-reach-the-finish-line)
  - The April 30, 2026 simplification review outcome was not found.
- **EU GPSR** (applies since Dec 2024):
  - Etsy now requires responsible-person details per listing and has partnered with Cert-Rep and International Associates — [Etsy Help](https://help.etsy.com/hc/en-in/articles/28211364687383-What-is-the-General-Product-Safety-Regulation-GPSR)
  - Responsible-person packages are reportedly £20–100/year, and sellers warn about predatory services — [Shopify Community](https://community.shopify.com/t/how-to-be-gpsr-compliant-and-locate-a-responsible-person-in-the-eu/390224)
  - Saturated and low-price. A per-listing tech-file generator is possible but weak.
- **MoCRA (cosmetics):**
  - Small businesses (about $1M average US cosmetic sales, inflation-adjusted) are exempt from registration, listing and GMP, but not from adverse-event reporting or safety substantiation — [FDA MoCRA](https://www.fda.gov/cosmetics/cosmetics-laws-regulations/modernization-cosmetics-regulation-act-2022)
  - The adverse-event retention period conflicts across sources (3 vs 6 years) — [Registrar Corp](https://www.registrarcorp.com/blog/cosmetics/mocra/mocra-exemptions/); [NSF](https://www.nsf.org/knowledge-library/fda-modernization-cosmetics-regulation-act)
  - Light recurring burden for exempt indie brands.
- **OSHA heat rule:**
  - No final federal standard. The proposed rule was published Aug 30, 2024 and post-hearing comments closed Oct 30, 2025; a supplemental proposal is possibly targeted for Dec 2026 — [OSHA rulemaking](https://www.osha.gov/heat-exposure/rulemaking); [Lockton](https://insights.lockton.com/workers-comp-trends-to-watch/sept-2026/heat-regulation-accelerates-at-state-level-federal-rulemaking-remains-uncertain)
  - The Heat NEP was revised April 10, 2026 for 5 years — [Sidley](https://environmentalhealthsafetybrief.sidley.com/2026/04/17/hot-off-the-press-what-employers-should-know-about-oshas-updated-national-emphasis-program-for-heat-illness/)
  - State standards exist (CA, CO, MD, MN, NV, OR, WA); Nevada applies to employers with more than 10 employees — [Lockton](https://insights.lockton.com/workers-comp-trends-to-watch/sept-2026/heat-regulation-accelerates-at-state-level-federal-rulemaking-remains-uncertain)
  - Plans and training records are crowded by EHS suites. Watch for a final federal rule.
- **CA balcony inspections (SB 721/SB 326):**
  - SB 721's first deadline was extended to Jan 1, 2026, then every 6 years; SB 326 condos every 9 years, with a disputed Jan 2025/2026 first deadline — [Oakland](https://www.oaklandca.gov/Planning-Building/Building-Inspections/Building-Inspections/Inspections-of-Balconies-Decks-and-other-Exterior-Elevated-Elements); [Malibu](https://malibucity.org/e3); [FS Residential](https://www.fsresidential.com/california/news-events/articles/california-balcony-inspections-2025-update/)
  - The backlog deadline has passed and the 6–9 year cycle is too infrequent for SaaS (though inspector report tooling is possible).
- **Corporate Transparency Act/BOI:** excluded as legal per the brief. From prior knowledge (not re-verified this session), FinCEN's March 2025 interim final rule removed BOI reporting for US domestic companies, so it is not a viable SMB opportunity.
- **EU Accessibility Act** (applied June 28, 2025): not researched in depth this session. From general knowledge, micro-enterprises providing services are exempt, and the space is crowded with overlay and audit vendors. Low fit for a record-keeping tool.

### Inferences
- Across all candidates, the strongest solo-dev fits share four traits:
  - (1) a per-asset or per-unit due date, such as a truck, an appliance, a rental unit, a SKU or a 45-day cycle;
  - (2) a document a regulator, inspector or customer asks for;
  - (3) a public licensing or registry list for outreach (CARB tester list, CA data broker registry, state tobacco retailer licenses, NJ lead evaluator list);
  - (4) no need to certify compliance yourself.
- Clean Truck Check, the NJ lead-safe tracker and the vape directory checker meet all four with the lowest regulatory-reversal risk.
- The HFC leak log meets all four but carries rollback risk and an existing $29–89 competitor.
- DROP has the best-enumerated buyers, but carries privacy and reputational risk.
- Avoid products that "certify" (accessibility, CRA, PPWR DoC) or "advise". Frame everything as a log, a reminder, a document generator, or a data-prep export.

### Gaps
- No market-size counts were found for most segments (testers, Tier 2 buildings, NJ rental units, vape retailers, HFC appliances). These need follow-up via state license databases before choosing.
- Competitor pricing is missing for most niches except refrigerant (Ref LeakLog $29–89/month; Trakref custom).
- No Reddit/forum pain-signal research was done this session, beyond Shopify community GPSR threads.
