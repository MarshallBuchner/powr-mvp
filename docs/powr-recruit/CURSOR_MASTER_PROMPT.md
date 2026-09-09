# MASTER CURSOR PROMPT — BUILD POWR RECRUIT

You are working inside the existing POWR web app or a new Next.js App Router project.

Build a polished, production-quality digital product landing page and delivery flow for:

# POWR Recruit
## The Complete Hockey Recruiting Toolkit

Price: **$39 CAD one-time**

## Product goal
POWR Recruit helps hockey players and parents:
- build a professional player profile
- structure a stronger recruiting/highlight reel
- contact coaches professionally
- stay organized throughout the recruiting process
- prepare for tryouts/showcases
- follow a clear recruiting roadmap

This product must NOT promise:
- guaranteed recruiting
- scholarships
- roster spots
- scout attention
- contracts
- “get noticed instantly”

Instead, position it as:
> A professional system that helps players present themselves clearly, stay organized, and make it easier for coaches to evaluate them.

---

# TECH STACK

Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- responsive layout
- clean reusable components
- accessible semantic HTML
- mobile-first behavior
- subtle animation only where useful

If the existing app already has shared components, reuse them when possible.

Do not break existing POWR routes or styles.

---

# ROUTES TO BUILD

## `/recruit`
Main landing page.

Sections in this exact order:
1. Sticky header
2. Hero
3. Trust/value strip
4. Problem / before-after section
5. What's inside
6. Player profile example
7. Highlight reel blueprint preview
8. Coach contact pack preview
9. Recruiting tracker preview
10. Tryout/showcase checklist preview
11. Recruiting roadmap preview
12. Who it is for
13. How it works
14. Offer stack
15. FAQ
16. Final CTA
17. Footer

## `/recruit/sample-profile`
Show a polished example hockey recruiting profile.

## `/recruit/thank-you`
Purchase success page:
- thank customer
- explain what happens next
- show download button
- show optional POWR assessment upsell

## `/recruit/download`
Protected or semi-protected delivery page for the digital toolkit.
For now, if payment integration is not wired, structure it so gating can be added later.

---

# HERO COPY

Eyebrow:
PREPARE • PRESENT • GET NOTICED • PLAY HIGHER

Headline:
STOP SENDING COACHES RANDOM CLIPS
AND HOPING THEY NOTICE.

Subheadline:
POWR Recruit gives hockey players and parents the tools to build a professional player profile, organize recruiting outreach, create a stronger highlight reel, and track every opportunity.

Primary CTA:
GET POWR RECRUIT — $39 CAD

Secondary CTA:
SEE WHAT'S INSIDE

Microcopy:
One-time purchase • Instant access • No subscription

---

# CORE PRODUCT STACK

Show these as premium product cards:

1. Player Resume Builder
2. Player Bio Builder
3. Highlight Reel Blueprint
4. Coach Contact Pack
5. Recruiting Tracker
6. Tryout & Showcase Checklist
7. Recruiting Roadmap
8. Example Pack
9. START HERE Guide

Add:
- icon
- short value statement
- subtle visual preview
- “Included” state

---

# DESIGN DIRECTION

Use:
- dark black/charcoal backgrounds
- white text
- neon green highlight
- rink / ice / subtle hockey texture
- premium athlete photography placeholders
- green accent lines
- clean modern UI panels
- bold sports typography for headlines
- standard clean sans-serif for body

Avoid:
- cheesy gradients
- cartoon graphics
- excessive glow
- fake testimonials
- fake logos
- overclaiming

---

# PRODUCT PAGE TONE

Tone:
- premium
- credible
- direct
- practical
- player-first
- parent-friendly

Do not use “secret system”, “guaranteed”, “hack”, “dominate”, or scammy urgency.

---

# OFFER SECTION

Headline:
EVERYTHING YOU NEED TO PRESENT YOURSELF PROPERLY.

Price:
$39 CAD

Bullets:
- Professional player resume template
- Highlight reel structure guide
- Coach email + DM templates
- Recruiting tracker
- Player bio builder
- Tryout/showcase checklist
- Recruiting roadmap
- Completed examples
- Lifetime access to your files

CTA:
GET POWR RECRUIT — $39 CAD

Guarantee text:
Use it for 14 days. If it isn't useful, request a refund.

---

# FAQ

Q: Will this get me recruited?
A: No toolkit can guarantee that. POWR Recruit helps you present yourself professionally, organize your outreach, and make it easier for coaches to review your information.

Q: Is this only for elite players?
A: No. It is designed for competitive players and families who want a clearer recruiting process, whether they are pursuing junior, prep, college/university, or simply a new team opportunity.

Q: Is this a subscription?
A: No. It is a one-time purchase.

Q: Can parents use it?
A: Yes. The toolkit is intentionally designed to be useful for both players and parents.

Q: Is the highlight reel created for me?
A: The base toolkit teaches you how to structure and improve your reel. Personalized reel review can be sold as an optional upsell.

Q: What format are the files?
A: The package should include PDF guides, editable templates, and a recruiting tracker spreadsheet.

---

# UPSELL

Optional post-purchase upsell:
POWR Recruiting Reel Review
Price target: +$30 CAD

Copy:
Want a second set of eyes on your recruiting tape?
Submit your reel and receive structured feedback on clip order, clarity, player identification, pacing, and overall presentation.

Optional second upsell:
POWR Player Assessment
Price target: +$20–30 CAD

---

# ANALYTICS EVENTS

Create event hooks/placeholders for:
- recruit_view
- recruit_cta_click
- recruit_scroll_50
- recruit_offer_view
- recruit_checkout_click
- recruit_purchase
- recruit_download
- recruit_upsell_click

If Vercel Analytics is already installed, wire these into the existing analytics solution.

---

# RESPONSIVE BEHAVIOR

Mobile:
- hero text first
- product preview second
- sticky bottom CTA after initial scroll
- cards stack vertically
- large tap targets
- no tiny text
- optimize for TikTok/Instagram ad traffic

Desktop:
- split hero layout
- product cards in 3-column grid
- sample profile + supporting cards side-by-side

---

# DELIVERABLE

Build the page in a polished, launch-ready state.

Use placeholder assets only where real images are not provided.

Do NOT invent URLs that do not exist.

If checkout is not configured, create a clean `handleCheckout()` abstraction and clear TODO comment where Stripe/Lemon Squeezy/Gumroad checkout will later be wired.

Use the exact copy from `LANDING_PAGE_COPY.md` where practical.
