# POWR Trybe integration review — October 7, 2026

## Production and PR baseline

- Refetched origin before editing. Main is `2f21561a1486e1254782eae3e1450556c0a9fe73`; no subsequent main commits exist in this repository.
- Draft PR #23 remains open, unmerged and mergeable without conflicts: https://github.com/MarshallBuchner/powr-mvp/pull/23. It is reused, not rebased or replaced.
- Vercel's current production deployment is `4BR9xKfm6o7zPLTD2bMjdh9Lq2UR`, source `d5f98bf019f18c99875e3de580993c40cd45ed76` on `codex/trybe-attribution`. This is the October 6 deployment approved previously. Main is the configured production branch. No production deployment or environment change was made during this review.
- Purchase reporting was explicitly configured false for that deployment. This review does not enable it, provision credentials, run SQL, charge a card, publish a program, launch ads or initiate payouts.

## Already complete

- ChatGPT OAuth is connected to POWR; a live brand-context call succeeds. Read-only access exposes creators, submissions, products, creative analysis, performance and conversations. No write tools are authorized; no program-creation tool is exposed. No Brand API key was created.
- Brand currency CAD; analytics timezone America/Los_Angeles. Brand classification remains Mobile App.
- The custom tracking domain is configured and Trybe shows Connected. The official snippet is deployed on the isolated public `/trybe` HTML document. Full navigation unloads the script before entering private app pages.
- Existing PR code captures the store-specific visitor cookie in Stripe Checkout metadata. After Stripe signature verification and the existing idempotent credit grant, a disabled-by-default reporter can submit eligible live paid CAD pack orders. It uses stable order IDs, handles duplicate responses and sends no email, skating footage or report.
- The creator brief covers the CA$19 pack, CA$5 confirmed-sale commission, authentic short-form hockey UGC, footage/upload/analysis/report/takeaway/free CTA sequence and prohibited claims.

## Findings and changes in this review

1. **Confirmed pixel blocker:** the live `/trybe` HTTP response uses the app-wide Content-Security-Policy, whose script/connect allowlists exclude Trybe. Added an exact `/trybe` policy allowing only the official tracking script and documented tracking/service endpoints. The global policy is unchanged; the public page has no app layout, authentication or report UI. Its referrer policy is explicitly no-referrer.
2. **Additional delivery uncertainty:** a public pixel-script fetch reset its connection; Chrome reported a client-side block. The October 6 proxy-delivery support request remains unanswered. The CSP fix is necessary but cannot establish end-to-end tracking alone.
3. **Stale organic attribution assumption:** support confirms Trybe does not provide automatic creator-specific organic affiliate links/codes. Organic sales need external attribution and compensation recorded separately. Corrected the brief and landing notice; this PR does not implement or promise organic affiliate tracking.
4. **Regression test gap:** the standard test command previously omitted Trybe and payment suites. Added both. Updated the payment test loader to exercise the real Trybe reporter with reporting disabled, resolving the PR-introduced module-resolution failure without changing production payment code.
5. Updated this status document to replace obsolete pre-deployment statements and record current blockers.

## Current Trybe state and launch blockers

- First pixel session: **not registered** (`last_session_at=null`, health `no_data`). No orders recorded.
- Attribution: **unavailable in the wizard**. Trybe radio and Next remain disabled. The documented prerequisite is the first real pixel event, not an order or ad account.
- Product catalog: **empty**, including inactive products. The program cannot reach Products or Definitions while attribution is disabled; it is not fully configurable.
- Program: **not saved/published**. Restored the wizard to CA$5 per order, videos only, no cap, with weekly default pending owner review, then stopped at Attribution. Local brief is the durable review draft.
- Support has no confirmed refund/chargeback/cancellation reversal workflow and no confirmed sandbox/full order test guaranteed to avoid creator earnings. Do not invent either workflow or submit a test order to the live Orders API.
- No active programs, creators, pending submissions or ad accounts. Performance tools are connected but have no campaign data to analyze.

## Validation

- TypeScript check: passes.
- Tests: all 16 pass (5 consent/share-token, 4 mocked Trybe, 7 existing payment/access regressions). No live API order or charge.
- Production build: passes locally with Next 16.2.10 after permitting the build to fetch Google Fonts. The initial sandbox attempt could not fetch fonts; the initial symlinked dependency layout also required local dependency copies. No build configuration workaround was committed.
- Full lint: fails with 19 errors and 5 warnings. A clean archive of current main produces the same file/rule findings and counts. Existing React-hook issues and CommonJS test-style rules are outside this Trybe fix. Targeted lint for the Trybe production code and config passes.
- Built-server header check: `/trybe` receives its narrow Trybe policy; `/login` retains the unchanged global policy. No requests to assessment generation, auth mutations, Stripe charges or the database were made.
- Known existing build warning: middleware convention deprecated in favor of proxy. Left unchanged.

## Approval and remaining decisions

The next production action is to deploy the reviewed update to PR #23 with `TRYBE_ORDERS_ENABLED=false`, then visit `/trybe` and verify the first pixel session and visitor attribution. Do not merge or promote without owner approval. Full lint remains a baseline failure; disclose it rather than claim an all-green gate.

Before publication, resolve pixel delivery and confirm the first event, unlock product/program configuration, choose a supported organic attribution approach, define refund/chargeback eligibility and adjustment handling, establish a safe non-commissioning end-to-end verification method, and approve payout timing and paid-social usage rights. Enabling purchase reporting, publishing, payouts, ads and real charges require separate approval.

## Sources

- Trybe portal and live POWR brand-context/product MCP calls, October 7.
- Trybe support chat, October 5–6; no later response visible October 7.
- https://jointrybe.com/help/brand-guides/troubleshooting-attribution
- https://jointrybe.com/help/brand-guides/trybe-pixel-and-orders-api
- https://jointrybe.com/help/getting-started/how-to-create-a-commission-program-and-invite-creators
