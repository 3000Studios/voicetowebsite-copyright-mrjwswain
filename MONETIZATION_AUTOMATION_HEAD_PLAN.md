# Monetization & Automation Head Plan

Last updated: 2026-03-06

This is the single, top-level execution plan for monetization + growth automation.

- Human-readable source of truth: `MONETIZATION_AUTOMATION_HEAD_PLAN.md`
- Machine-readable roadmap: `ops/site/monetization-roadmap.json`
- Public mirror for tooling/admin: `public/config/monetization-roadmap.json`

## Goals (next 90 days)

1. Increase paid conversion rate from product pages and pricing flows.
2. Activate compliant ad revenue without harming UX/Core Web Vitals.
3. Scale referral + affiliate revenue with tracked attribution.
4. Establish AI-assisted content pipeline with quality guardrails.
5. Improve retention and ARPU through pricing, upsells, and app bundles.

## KPI Targets

- Checkout success rate (PayPal + Stripe): `>= 98%`
- Visitor to paid conversion: `+25%` from current baseline
- AdSense RPM: measurable and stable on content pages
- Referral-attributed paid signups: `>= 15%` of new paid users
- Content output: 2 high-quality SEO posts/week with review gate
- Mobile conversion lift from sticky CTA and checkout improvements: `+15%`

## Integration Map (repo paths)

### Payments + Commerce

- Worker checkout/capture/webhooks: `worker.js`
- Store catalog source: `ops/site/products.json`
- Store rendering + buy flows: `store.html`, `store-products.js`, `src/commerce.js`,
  `src/utils/cartManager.js`, `src/components/Checkout.tsx`

### AdSense + Affiliate

- AdSense shell injection + slot logic: `public/nav.js`, `worker.js`
- Ad config: `ops/site/adsense.json`, `public/config/adsense.json`
- Affiliate/referral config: `ops/site/affiliates.json`, `public/config/affiliates.json`
- Publisher declaration: `public/ads.txt`

### Automation + Distribution

- Content/config generation: `scripts/generate-config.mjs`, `scripts/prebuild.js`
- Social/email/content automations: `scripts/autopilot.mjs`, `voicetowebsite-orchestrator/*`
- Tracking/events: `worker.js` analytics endpoints + frontend event calls

### SEO + Discoverability

- Sitemap generation: `scripts/generate-sitemap.mjs`, `public/sitemap.xml`
- Metadata and structured content surfaces: public pages + React app surfaces

## Phased Execution Plan

## Phase 1 (Weeks 1-2): Revenue Foundations

1. Payment health check and checkout UX simplification.
2. AdSense policy audit + enablement on approved pages only.
3. Referral system activation with unique link flow and analytics events.
4. Mobile sticky CTA + trust proof insertion on pricing/store.

Exit criteria:

- End-to-end PayPal and Stripe checkout tested in production-safe mode.
- AdSense script and placements validated with no layout breakage.
- Referral link creation and click/signup attribution tracked.

## Phase 2 (Weeks 3-4): Conversion Engine

1. Pricing tests (entry tier, annual billing framing, bundles).
2. Dynamic coupons for abandoned or stalled checkout sessions.
3. Cart/order bump and post-purchase upsell automation.
4. Product card and checkout friction reductions.

Exit criteria:

- A/B or staged tests active for at least one pricing hypothesis.
- Coupon triggers and upsell rules operational and measurable.

## Phase 3 (Weeks 5-8): Automated Growth

1. AI-assisted blog pipeline (draft -> QA -> publish).
2. Auto-distribution to social/email channels.
3. Referral/affiliate partner activation campaigns.
4. High-CPC topic cluster rollout (monetization, SaaS growth, SEO, creator finance).

Exit criteria:

- Minimum 2 reviewed posts/week.
- Auto-sharing workflow publishing to at least 2 channels.
- Partner outreach + recurring affiliate communications running.

## Phase 4 (Weeks 9-12): Scale + Optimization

1. Expand high-demand app catalog and category merchandising.
2. Improve in-app upsells and subscriber-only app incentives.
3. Tighten SEO technical health and Core Web Vitals.
4. Promote winning experiments and remove underperforming variants.

Exit criteria:

- New app launches follow a repeatable monthly release process.
- Conversion and ARPU trends up for two consecutive reporting windows.

## Operating Cadence

Weekly:

1. Review KPI dashboard (conversion, RPM, referral share, checkout errors).
2. Ship one conversion improvement and one traffic/content improvement.
3. Run `npm run verify` before any ship/deploy path.

Release flow (locked):

1. `nvm use 20`
2. `npm run verify`
3. `npm run ship -m "feat: <change>"`
4. `npm run ship:push`
5. `npm run deploy`

## Guardrails

1. Never deploy red builds.
2. Keep AdSense pages policy-safe: clear disclosures, valuable content, no ad stuffing.
3. Keep referral and affiliate disclosures visible and compliant.
4. Keep AI content human-reviewed before publication.
5. Preserve execute/auth/schema/command-center and checkout reliability while iterating.
