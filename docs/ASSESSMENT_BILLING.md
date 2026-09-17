# POWR assessment billing (soft upgrade)

Layered around the existing guest upload → analyze → report flow.

## Product rules (v1)
- **1 free real assessment** per browser (sample assessments stay free forever)
- After value (report), soft upgrade CTA
- **One-time pack**: 5 assessments for **$19 CAD** (no subscription)
- Creator attribution via `?ref=creatorname` (also `?creator=` / `?via=`)

## Accounts
Existing magic-link accounts still used for **save/history** only.
Login is not required to run the free assessment or buy a pack.

## Stripe setup
1. Same `STRIPE_SECRET_KEY` as Recruit
2. Optional Dashboard price: `STRIPE_ASSESSMENT_PRICE_ID`
3. If unset, checkout uses inline `$19 CAD` price data
4. Success URL: `/unlock?session_id={CHECKOUT_SESSION_ID}`
5. Without Stripe key, checkout returns preview unlock (`/unlock?preview=1`)

## Routes
- `POST /api/assessments/checkout` — start Stripe Checkout
- `GET /api/assessments/verify` — confirm payment + grant credits cookie
- `GET/POST /api/assessments/entitlement` — read/sync entitlement cookie
- `POST /api/analyze` — consumes free/credit; returns `402` when empty
- `/unlock` — post-purchase confirmation

## Creator links
Share: `https://YOUR_DOMAIN/?ref=creatorname`

Stored in `localStorage` and passed into Stripe metadata `ref` for attribution.

## Analytics events
- `creator_ref_captured`
- `upgrade_viewed` / `upgrade_clicked`
- `assessment_pack_unlocked`
- existing `analyze_clicked` / `analysis_succeeded` / `report_viewed`

## Explicitly unchanged
- Sample assessment path
- Report content / scoring prompts
- Recruit checkout product
