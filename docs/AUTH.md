# POWR accounts (magic link) — skating assessments

Accounts are for the **skating assessment product loop** (save reports + come back later).

**POWR Recruit stays account-free** — Stripe checkout + download only.

## What this enables
- Magic-link email sign-in (QuitCurve-style)
- Save assessment reports after viewing them
- `/assessments` history list
- Stable share links at `/r/[id]` for saved reports
- Guest first assessment still works with no account
- **Signed-in entitlement balance** on `profiles` (1 free + paid credits) — see `docs/ASSESSMENT_BILLING.md`
- Soft upgrade after free assessment

## Setup
1. Create a Supabase project
2. Add env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY   # server-only; Stripe webhook grants
# Optional in production if you use apex + www:
# NEXT_PUBLIC_COOKIE_DOMAIN=.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://trainwithpowr.com
```

3. Run `supabase/schema.sql` in the Supabase SQL editor (includes entitlement RPCs + credit grants table)
4. Auth → Providers → Email enabled
5. Auth → URL Configuration:
   - Site URL: `https://trainwithpowr.com`
   - Redirect URLs include:
     - `http://localhost:3000/auth/callback`
     - `https://trainwithpowr.com/auth/callback`

## Preferred email template (avoids PKCE cookie issues)
Supabase → Authentication → Email Templates → Magic Link:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/assessments">
  Sign in to POWR
</a>
```

## Product loop
1. Guest or signed-in user uploads skating clip → analysis → report
2. Signed-in: free/credit consumed on profile; guest: device cookie
3. Clicks **Save report & create free account** (or save if already signed in)
4. If logged out → magic link → pending report auto-saves + device entitlement merges into profile
5. Reopen anytime at `/assessments` or `/r/[id]`; balance persists across devices when signed in
6. Pack purchase (signed in) → Stripe Checkout → webhook grants 5 credits to profile

## Notes
- Video files stay on-device in v1 (we save analysis JSON, not the video blob)
- Recruit routes intentionally skip account chrome and auth requirements
- See `docs/ASSESSMENT_BILLING.md` for Stripe webhook + env vars
