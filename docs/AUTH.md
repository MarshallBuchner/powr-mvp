# POWR accounts (email OTP) — skating assessments

Accounts are for the **skating assessment product loop** (save reports + come back later).

**POWR Recruit stays account-free** — Stripe checkout + download only.

## What this enables
- Email OTP sign-in (6-digit code entered on POWR — works across Mail/Gmail apps)
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
   - Redirect URLs include (optional fallback for magic-link emails):
     - `http://localhost:3000/auth/callback`
     - `https://trainwithpowr.com/auth/callback`

## Required: Auth email template must show the OTP code

Primary sign-in is **email → 6-digit code → verify on `/login`**. Supabase still uses the **Magic Link** email template for `signInWithOtp`.

**Supabase Dashboard → Authentication → Email Templates → Magic Link**

The body **must** include `{{ .Token }}` (the 6-digit code). Example:

```html
<h2>Sign in to POWR</h2>
<p>Your sign-in code is:</p>
<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>Enter this code in the POWR app. It expires soon.</p>
<p>Or use this link if you prefer:</p>
<p>
  <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/assessments">
    Sign in to POWR
  </a>
</p>
```

Without `{{ .Token }}` in the template, users only get a link and cannot complete OTP-on-page sign-in.

`/auth/callback` remains as a fallback for link-based recovery; OTP login does not depend on it.

## Product loop
1. Guest or signed-in user uploads skating clip → analysis → report
2. Signed-in: free/credit consumed on profile; guest: device cookie
3. Clicks **Save report & create free account** (or save if already signed in)
4. If logged out → email OTP → pending report auto-saves + device entitlement merges into profile
5. Reopen anytime at `/assessments` or `/r/[id]`; balance persists across devices when signed in
6. Pack purchase (signed in) → Stripe Checkout → webhook grants 5 credits to profile

## Notes
- Video files stay on-device in v1 (we save analysis JSON, not the video blob)
- Recruit routes intentionally skip account chrome and auth requirements
- See `docs/ASSESSMENT_BILLING.md` for Stripe webhook + env vars
