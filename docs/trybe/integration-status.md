# POWR Trybe integration review — October 5, 2026

## Verified and prepared

- ChatGPT OAuth is connected to POWR and a live brand-context call succeeds. Access is read-only; no Brand API key was created. Creators, submissions, products, creative analysis, performance and conversations are available as read tools. No program-creation tool is exposed.
- Brand currency CAD; analytics timezone America/Los_Angeles. No active programs, creators, submissions, ad accounts or orders.
- Tracking CNAME track.trainwithpowr.com points to proxy.jointrybe.com and Trybe shows Connected, but no pixel sessions have been received.
- Program wizard restored with POWR Hockey Creator Program, weekly default for review, CA$5 per order, videos only, no cap. It remains unsaved at Attribution.
- Trybe's troubleshooting guide now explains that the first real pixel event unlocks Trybe attribution. An order, ad account or Shopify connection is not required. Mobile App classification is not an established blocker.
- Draft PR #23: https://github.com/MarshallBuchner/powr-mvp/pull/23
- Preview build succeeded for commit 8dff922. The public /trybe landing document was visually checked. It loads the official pixel in an isolated document and navigates fully into the app, so its tracking script does not persist onto private report or authentication pages.
- Stripe Checkout captures the store-specific visitor cookie in metadata. The verified Stripe webhook reports only live, paid, positive-value CAD assessment-pack orders, with stable order IDs and safe duplicate retries. No email, skating video or report is transmitted.
- Order reporting is disabled by default. The existing Orders API key must be privately configured as TRYBE_ORDERS_API_KEY; it is separate from a Brand API key.
- TypeScript, targeted lint and four mocked test groups passed. No charge, order submission, creator payout, ad or program publication occurred.

## Pending approval and verification

1. Production deployment is blocked by automatic approval review: it requires the owner's explicit approval. This would add /trybe and the dormant Stripe attribution code to trainwithpowr.com. Order reporting remains off. Current production remains commit 2f21561.
2. After approved deployment, visit https://trainwithpowr.com/trybe and verify a first session in Trybe. Then reopen the wizard and select Trybe 7-day last-click attribution, finish product/definition configuration, and stop before Create Program/publication.
3. Approved content receives a video-specific ?trybe= code according to Trybe's guide. Confirm organic creator sharing support and use the real assigned code at /trybe?trybe=CODE; do not invent an active creator code.
4. Trybe support was contacted through portal chat with explicit owner authorization. Asked about refunds/chargebacks, organic links, non-commissioning tests and excluding private pages. Follow-up corrected the initial business-type hypothesis after finding the first-event requirement. No support answer received yet.
5. Configure the existing Orders API key privately, verify Stripe webhook settings and complete an end-to-end test using Trybe's confirmed non-commissioning procedure. Do not enable live order reporting until refund/chargeback handling and payout confirmation rules are settled.
6. Owner must review weekly payout timing, discount eligibility, refund confirmation timing and paid-social usage rights/duration. Publication requires separate approval, as do payouts, ads and real charges.

## Sources

- https://jointrybe.com/help/brand-guides/troubleshooting-attribution
- https://jointrybe.com/help/brand-guides/trybe-pixel-and-orders-api
- https://jointrybe.com/help/getting-started/how-to-create-a-commission-program-and-invite-creators
