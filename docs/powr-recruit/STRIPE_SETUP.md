# Stripe setup — POWR Recruit

## Go-live (fastest)
1. Create a Stripe account and copy a **Secret key**.
2. Add to your environment (Vercel / local `.env.local`):

```bash
STRIPE_SECRET_KEY=sk_live_or_test_...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

3. Redeploy / restart the app.
4. Click **GET POWR RECRUIT — $39 CAD**.

With only `STRIPE_SECRET_KEY` set, Checkout uses an inline **CAD $39**
`price_data` line item for “POWR Recruit — The Complete Hockey Recruiting Toolkit”.

## Optional stable Price ID
If you prefer a reusable Price created in Stripe Dashboard:

```bash
STRIPE_RECRUIT_PRICE_ID=price_...
```

Then checkout uses that Price instead of inline `price_data`.

## Flow
1. CTA → `POST /api/recruit/checkout`
2. Stripe Checkout (or preview fallback if no secret key)
3. Success → `/recruit/thank-you?session_id=...`
4. Download page → `/recruit/download?session_id=...`
5. `GET /api/recruit/verify` confirms payment
6. `GET /api/recruit/download?session_id=...` streams the private ZIP

## Preview mode
If `STRIPE_SECRET_KEY` is missing, checkout redirects to:
`/recruit/thank-you?preview=1`
so the funnel can still be tested end-to-end. Use download with `session_id=preview`.
