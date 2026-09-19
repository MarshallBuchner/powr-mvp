# POWR assessment billing (soft upgrade)

Layered around the existing guest upload → analyze → report flow.

## Product rules (v1)
- **1 free real assessment** (sample assessments stay free forever)
- After value (report), soft upgrade CTA
- **One-time pack**: 5 assessments for **$19 CAD** (no subscription)
- Creator attribution via `?ref=creatorname` (also `?creator=` / `?via=`)

## Entitlement source of truth
| User state | Source of truth |
|---|---|
| **Signed in** | `profiles.free_assessments_used` + `profiles.assessment_credits` |
| **Guest** | Device cookie `powr_ent_v1` + localStorage `powr_entitlement_v1` |

- New profiles start at `free_assessments_used = 0` → **1 free** remaining
- Real `POST /api/analyze` consumes atomically via RPC `consume_assessment_credit()` (free first, then credits)
- Sample/demo never calls analyze → never consumes
- On login, device balance merges once into profile with `merge_assessment_entitlement` (`greatest` — no double free)

## Accounts
Magic-link accounts: **save/history + entitlement balance** when signed in.
Guest first assessment still works with no account.
**Buying a pack requires sign-in** so Stripe can credit the profile via webhook.

## Stripe setup
1. `STRIPE_SECRET_KEY`
2. Optional Dashboard price: `STRIPE_ASSESSMENT_PRICE_ID` (else inline $19 CAD)
3. `STRIPE_WEBHOOK_SECRET` for `/api/stripe/webhook`
4. `SUPABASE_SERVICE_ROLE_KEY` (server-only) so webhook can grant credits
5. Success URL: `/unlock?session_id={CHECKOUT_SESSION_ID}`
6. Webhook events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
7. Without Stripe key, checkout returns preview unlock (`/unlock?preview=1`)

### Webhook (source of truth for paid credits)
- Endpoint: `https://trainwithpowr.com/api/stripe/webhook` (and preview URL if needed)
- Grants exactly the session’s credits to `metadata.user_id` / `client_reference_id`
- Idempotent via `assessment_credit_grants.stripe_session_id`
- Unlock page confirms payment with `/api/assessments/verify`, then **reads** profile balance (does not grant)

## Routes
- `POST /api/assessments/checkout` — Stripe Checkout (requires auth for live)
- `POST /api/stripe/webhook` — grant profile credits (idempotent)
- `GET /api/assessments/verify` — confirm paid + return balance
- `GET/POST /api/assessments/entitlement` — profile when signed in; cookie when guest
- `POST /api/analyze` — consume free/credit; `402` when empty
- `/unlock` — post-purchase confirmation

## SQL to run
Re-run `supabase/schema.sql` in the Supabase SQL editor (safe / idempotent). Adds:
- `assessment_credit_grants` table
- RPCs: `consume_assessment_credit`, `merge_assessment_entitlement`, `grant_assessment_pack_credits`

## Env vars (Vercel)
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # webhook grants only — never expose to client
NEXT_PUBLIC_SITE_URL=https://trainwithpowr.com
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_ASSESSMENT_PRICE_ID=         # optional
OPENAI_API_KEY=
```

## Auth redirect URLs (Supabase)
- Site URL: `https://trainwithpowr.com`
- Redirect URLs:
  - `https://trainwithpowr.com/auth/callback`
  - `http://localhost:3000/auth/callback`

## Creator links
Share: `https://YOUR_DOMAIN/?ref=creatorname`

## Explicitly unchanged
- Sample assessment path
- Report content / scoring prompts
- Recruit checkout product
- No subscriptions / billing portal
