# POWR accounts (magic link) — skating assessments

Accounts are for the **skating assessment product loop** (save reports + come back later).

**POWR Recruit stays account-free** — Stripe checkout + download only.

## What this enables
- Magic-link email sign-in (QuitCurve-style)
- Save assessment reports after viewing them
- `/assessments` history list
- Stable share links at `/r/[id]` for saved reports
- Guest first assessment still works with no account

## Setup
1. Create a Supabase project
2. Add env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
# Optional in production if you use apex + www:
# NEXT_PUBLIC_COOKIE_DOMAIN=.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

3. Run `supabase/schema.sql` in the Supabase SQL editor
4. Auth → Providers → Email enabled
5. Auth → URL Configuration:
   - Site URL: your production URL
   - Redirect URLs include:
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.com/auth/callback`

## Preferred email template (avoids PKCE cookie issues)
Supabase → Authentication → Email Templates → Magic Link:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/assessments">
  Sign in to POWR
</a>
```

## Product loop
1. Guest uploads skating clip → analysis → report
2. Clicks **Save to My POWR Account**
3. If logged out → magic link → pending report auto-saves
4. Reopen anytime at `/assessments` or `/r/[id]`

## Notes
- Video files stay on-device in v1 (we save analysis JSON, not the video blob)
- Recruit routes intentionally skip account chrome and auth requirements
