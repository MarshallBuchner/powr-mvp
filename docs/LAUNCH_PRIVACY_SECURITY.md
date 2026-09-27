# Launch privacy / security notes

## Required Supabase migration

Before enabling public Stripe payments, run:

`supabase/migrations/20260927_shared_reports_private_by_default.sql`

This:

1. Drops the world-readable `assessments_select_public_by_id` policy
2. Creates `shared_reports` for opaque tokenized share links

Also ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel so `/api/reports/share` and `/r/s/[token]` work.

## Support inbox

Public copy uses `support@trainwithpowr.com`. Configure that mailbox (or forward it) before launch.

## Behavior changes

- Analysis requires age eligibility + consent checkbox
- Reports are private by default; sharing creates `/r/s/[token]`
- Legacy `/r?d=…` links still open with a banner, but new reports do not create them
- Saved `/r/[id]` requires the owner to be signed in
