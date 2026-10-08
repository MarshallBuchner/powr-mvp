const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');
const Stripe = require('stripe');

function load(file, mocks, env = {}) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(js, {
    exports, require: name => name in mocks ? mocks[name] : require(name),
    process: { env }, console: { error() {} },
  }, { filename: file });
  return exports;
}
const billing = { ASSESSMENT_PACK_CREDITS: 5, ASSESSMENT_PRODUCT_ID: 'powr_assessment_pack' };
const signingSecret = 'whsec_local_regression_test';
const session = { id: 'cs_test_pack', status: 'complete', payment_status: 'paid', metadata: { product: 'powr_assessment_pack', user_id: 'user-1', credits: '5' } };

function webhook(grants) {
  return load('app/api/stripe/webhook/route.ts', {
    '@/lib/assessmentBilling': billing,
    '@/lib/profileEntitlements': { grantPackCreditsToProfile: async (_, user, id, credits) => {
      const alreadyGranted = grants.has(id);
      if (!alreadyGranted) grants.set(id, { user, credits });
      return { alreadyGranted, creditsGranted: alreadyGranted ? 0 : credits, state: { credits: 5 } };
    } },
    '@/lib/supabase/admin': { createServiceClient: () => ({}), isServiceRoleConfigured: () => true },
  }, { STRIPE_SECRET_KEY: 'sk_test_local', STRIPE_WEBHOOK_SECRET: signingSecret });
}
async function deliver(route, data, type = 'checkout.session.completed', signed = true) {
  const body = JSON.stringify({ id: 'evt_test', type, data: { object: data } });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: signingSecret });
  return route.POST(new NextRequest('https://powr.test/api/stripe/webhook', {
    method: 'POST', body, headers: signed ? { 'stripe-signature': signature } : {},
  }));
}
test('webhook requires signature and rejects pending payments, even when checkout is complete', async () => {
  const grants = new Map(); const route = webhook(grants);
  assert.equal((await deliver(route, session, undefined, false)).status, 400);
  const res = await deliver(route, { ...session, payment_status: 'unpaid' });
  assert.equal((await res.json()).reason, 'unpaid');
  assert.equal(grants.size, 0);
});
test('webhook grants five credits for a paid pack and handles replay without another grant', async () => {
  const grants = new Map(); const route = webhook(grants);
  assert.equal((await (await deliver(route, session)).json()).creditsGranted, 5);
  assert.equal((await (await deliver(route, session)).json()).alreadyGranted, true);
  assert.equal(grants.size, 1);
});
test('webhook handles delayed success and ignores unrelated or missing product metadata', async () => {
  const grants = new Map(); const route = webhook(grants);
  for (const product of ['kept', undefined]) {
    await deliver(route, { ...session, metadata: { ...session.metadata, product } });
  }
  assert.equal(grants.size, 0);
  await deliver(route, session, 'checkout.session.async_payment_succeeded');
  assert.equal(grants.size, 1);
});
function verify({ user = { id: 'user-1' }, payment = session, grant = null } = {}) {
  let reads = 0;
  class FakeStripe { checkout = { sessions: { retrieve: async () => { reads++; return payment; } } }; }
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: grant, error: null }) };
  const route = load('app/api/assessments/verify/route.ts', {
    stripe: FakeStripe,
    '@/lib/assessmentBilling': billing,
    '@/lib/profileEntitlements': { readProfileEntitlements: async () => ({ credits: 20 }), entitlementResponse: state => state },
    '@/lib/supabase/config': { isSupabaseConfigured: () => true },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) }, from: () => query }) },
  }, { STRIPE_SECRET_KEY: 'sk_test_local' });
  return { request: q => route.GET(new NextRequest(`https://powr.test/api/assessments/verify?${q}`)), reads: () => reads };
}
test('preview URL never grants credits and unauthenticated requests never retrieve sessions', async () => {
  const route = verify({ user: null });
  assert.equal((await route.request('preview=1')).status, 400);
  assert.equal((await route.request('session_id=cs_test_pack')).status, 401);
  assert.equal(route.reads(), 0);
});
test('verification rejects another user and pending payments', async () => {
  assert.equal((await verify({ user: { id: 'other' } }).request('session_id=cs_test_pack')).status, 403);
  const res = await verify({ payment: { ...session, payment_status: 'unpaid' } }).request('session_id=cs_test_pack');
  assert.equal((await res.json()).paid, false);
});
test('verification waits for this purchase grant even when existing balance is positive', async () => {
  const res = await verify().request('session_id=cs_test_pack');
  assert.equal((await res.json()).awaitingWebhook, true);
  const done = await verify({ grant: { credits: 5 } }).request('session_id=cs_test_pack');
  const data = await done.json();
  assert.equal(data.awaitingWebhook, false);
  assert.equal(data.creditsGranted, 5);
});
test('founder access remains exact-email authenticated override', () => {
  const { isFounderUnlimited } = load('lib/founderAccess.ts', {}, { FOUNDER_UNLIMITED_EMAIL: 'marshallbuchner96@gmail.com' });
  assert.equal(isFounderUnlimited('MarshallBuchner96@gmail.com'), true);
  assert.equal(isFounderUnlimited('other@gmail.com'), false);
  assert.equal(isFounderUnlimited(null), false);
});

test('founding athlete allowlist is server-env exact match only', () => {
  const mod = load('lib/foundingAthleteAccess.ts', {}, {
    FOUNDING_ATHLETE_EMAILS: 'athlete.one@example.com, athlete.two@example.com',
  });
  assert.equal(mod.isApprovedFoundingAthleteEmail('Athlete.One@example.com'), true);
  assert.equal(mod.isApprovedFoundingAthleteEmail('athlete.two@example.com'), true);
  assert.equal(mod.isApprovedFoundingAthleteEmail('other@example.com'), false);
  assert.equal(mod.isApprovedFoundingAthleteEmail(null), false);
  assert.equal(mod.hasVerifiedAuthEmail({ email: 'athlete.one@example.com', email_confirmed_at: '2026-01-01' }), true);
  assert.equal(mod.hasVerifiedAuthEmail({ email: 'athlete.one@example.com', email_confirmed_at: null }), false);
});

test('founding balance treats calendar month reset and expiry correctly', () => {
  const mod = load('lib/foundingAthleteAccess.ts', {});
  const now = new Date('2026-10-15T12:00:00Z');
  const active = mod.foundingBalanceFromProfile({
    founding_activated_at: '2026-09-01T00:00:00Z',
    founding_expires_at: '2027-03-01T00:00:00Z',
    founding_month_key: '2026-09',
    founding_month_used: 20,
  }, { now, currentMonthKey: '2026-10' });
  assert.equal(active.active, true);
  assert.equal(active.monthUsed, 0);
  assert.equal(active.monthRemaining, 20);

  const sameMonth = mod.foundingBalanceFromProfile({
    founding_activated_at: '2026-09-01T00:00:00Z',
    founding_expires_at: '2027-03-01T00:00:00Z',
    founding_month_key: '2026-10',
    founding_month_used: 17,
  }, { now, currentMonthKey: '2026-10' });
  assert.equal(sameMonth.monthRemaining, 3);

  const expired = mod.foundingBalanceFromProfile({
    founding_activated_at: '2025-01-01T00:00:00Z',
    founding_expires_at: '2025-07-01T00:00:00Z',
    founding_month_key: '2026-10',
    founding_month_used: 0,
  }, { now, currentMonthKey: '2026-10' });
  assert.equal(expired.active, false);
  assert.equal(expired.monthRemaining, 0);
});

test('entitlement response prefers founding remaining and never exposes emails', () => {
  const billing = load('lib/assessmentBilling.ts', {});
  const founding = load('lib/foundingAthleteAccess.ts', {});
  // profileEntitlements imports admin/supabase — stub those modules.
  const pe = load('lib/profileEntitlements.ts', {
    '@/lib/assessmentBilling': billing,
    '@/lib/foundingAthleteAccess': founding,
    '@/lib/supabase/admin': {
      createServiceClient: () => ({ rpc: async () => ({ data: { ok: true }, error: null }) }),
      isServiceRoleConfigured: () => true,
    },
  });
  const state = { freeUsed: 1, credits: 5, unlockedSessionIds: [] };
  const bal = founding.foundingBalanceFromProfile({
    founding_activated_at: '2026-09-01T00:00:00Z',
    founding_expires_at: '2027-03-01T00:00:00Z',
    founding_month_key: '2026-10',
    founding_month_used: 4,
  }, { currentMonthKey: '2026-10', now: new Date('2026-10-15T12:00:00Z') });
  const res = pe.entitlementResponse(state, 'profile', { founding: bal });
  assert.equal(res.foundingAthlete, true);
  assert.equal(res.foundingMonthRemaining, 16);
  assert.equal(res.remaining, 16 + 5);
  assert.equal(res.canRun, true);
  assert.equal('email' in res, false);
  const json = JSON.stringify(res);
  assert.equal(json.includes('@'), false);
});

test('founding consume order: complimentary before paid credits', () => {
  const billing = load('lib/assessmentBilling.ts', {});
  const founding = load('lib/foundingAthleteAccess.ts', {});
  const pe = load('lib/profileEntitlements.ts', {
    '@/lib/assessmentBilling': billing,
    '@/lib/foundingAthleteAccess': founding,
    '@/lib/supabase/admin': {
      createServiceClient: () => ({}),
      isServiceRoleConfigured: () => false,
    },
  });
  const state = { freeUsed: 0, credits: 5, unlockedSessionIds: [] };
  const bal = {
    active: true,
    monthUsed: 0,
    monthAllowance: 20,
    monthRemaining: 20,
    expiresAt: '2027-03-01T00:00:00Z',
    activatedAt: '2026-09-01T00:00:00Z',
  };
  assert.equal(pe.canRunWithFounding(state, bal), true);
  // founding(20) + freeLeft(1) + credits(5)
  assert.equal(pe.remainingWithFounding(state, bal), 26);
  assert.equal(pe.canRunWithFounding({ freeUsed: 1, credits: 0, unlockedSessionIds: [] }, {
    ...bal, monthRemaining: 0, monthUsed: 20,
  }), false);
});

test('founding calendar month uses America/Toronto', () => {
  const mod = load('lib/foundingAthleteAccess.ts', {});
  assert.equal(mod.FOUNDING_TIMEZONE, 'America/Toronto');
  assert.equal(mod.torontoMonthKey(new Date('2026-10-15T12:00:00Z')), '2026-10');
});

test('after 20th complimentary consume, next assessment uses paid credits', () => {
  const mod = load('lib/foundingAthleteAccess.ts', {});
  const billing = load('lib/assessmentBilling.ts', {});
  const pe = load('lib/profileEntitlements.ts', {
    '@/lib/assessmentBilling': billing,
    '@/lib/foundingAthleteAccess': mod,
    '@/lib/supabase/admin': {
      createServiceClient: () => ({}),
      isServiceRoleConfigured: () => false,
    },
  });

  let buckets = {
    foundingActive: true,
    foundingMonthUsed: 19,
    freeUsed: 1,
    credits: 5,
  };

  const twentieth = mod.simulateConsumeAssessmentCredit(buckets);
  assert.equal(twentieth.ok, true);
  assert.equal(twentieth.consumedFrom, 'founding');
  assert.equal(twentieth.next.foundingMonthUsed, 20);
  assert.equal(twentieth.next.credits, 5);

  const twentyFirst = mod.simulateConsumeAssessmentCredit(twentieth.next);
  assert.equal(twentyFirst.ok, true);
  assert.equal(twentyFirst.consumedFrom, 'paid');
  assert.equal(twentyFirst.next.credits, 4);
  assert.equal(twentyFirst.next.foundingMonthUsed, 20);

  const balAfter20 = mod.foundingBalanceFromProfile({
    founding_activated_at: '2026-09-01T00:00:00Z',
    founding_expires_at: '2027-03-01T00:00:00Z',
    founding_month_key: '2026-10',
    founding_month_used: 20,
  }, { currentMonthKey: '2026-10', now: new Date('2026-10-15T12:00:00Z') });
  assert.equal(balAfter20.active, true);
  assert.equal(balAfter20.monthRemaining, 0);

  const state = { freeUsed: 1, credits: 4, unlockedSessionIds: [] };
  assert.equal(pe.canRunWithFounding(state, balAfter20), true);
  assert.equal(pe.remainingWithFounding(state, balAfter20), 4);

  const api = pe.entitlementResponse(state, 'profile', { founding: balAfter20 });
  assert.equal(api.foundingAthlete, true);
  assert.equal(api.foundingMonthRemaining, 0);
  assert.equal(api.remaining, 4);
  assert.equal(api.canRun, true);
  // UI should still allow analyze and not force purchase while credits remain.
  assert.equal(api.canRun && api.remaining > 0, true);
});

test('founding exhausted with no credits surfaces purchase + renew messaging', () => {
  const mod = load('lib/foundingAthleteAccess.ts', {});
  const billing = load('lib/assessmentBilling.ts', {});
  const pe = load('lib/profileEntitlements.ts', {
    '@/lib/assessmentBilling': billing,
    '@/lib/foundingAthleteAccess': mod,
    '@/lib/supabase/admin': {
      createServiceClient: () => ({}),
      isServiceRoleConfigured: () => false,
    },
  });

  const empty = mod.simulateConsumeAssessmentCredit({
    foundingActive: true,
    foundingMonthUsed: 20,
    freeUsed: 1,
    credits: 0,
  });
  assert.equal(empty.ok, false);
  assert.equal(empty.consumedFrom, null);

  const bal = mod.foundingBalanceFromProfile({
    founding_activated_at: '2026-09-01T00:00:00Z',
    founding_expires_at: '2027-03-01T00:00:00Z',
    founding_month_key: '2026-10',
    founding_month_used: 20,
  }, { currentMonthKey: '2026-10', now: new Date('2026-10-15T12:00:00Z') });

  const state = { freeUsed: 1, credits: 0, unlockedSessionIds: [] };
  const api = pe.entitlementResponse(state, 'profile', { founding: bal });
  assert.equal(api.canRun, false);
  assert.equal(api.remaining, 0);
  assert.equal(api.foundingAthlete, true);
  assert.equal(api.foundingMonthRemaining, 0);

  const withCreditsMsg = mod.foundingAllowanceExhaustedMessage({ hasOtherBalance: true });
  const purchaseMsg = mod.foundingAllowanceExhaustedMessage({ hasOtherBalance: false });
  assert.match(withCreditsMsg, /remaining assessments/i);
  assert.match(purchaseMsg, /unlock a pack/i);
  assert.match(purchaseMsg, /renew next month/i);
});

test('ordinary customer consume path ignores founding when not activated', () => {
  const mod = load('lib/foundingAthleteAccess.ts', {});
  const first = mod.simulateConsumeAssessmentCredit({
    foundingActive: false,
    foundingMonthUsed: 0,
    freeUsed: 0,
    credits: 5,
  });
  assert.equal(first.consumedFrom, 'free');
  const second = mod.simulateConsumeAssessmentCredit(first.next);
  assert.equal(second.consumedFrom, 'paid');
  assert.equal(second.next.credits, 4);
});

test('activateFoundingAthleteIfEligible rejects unverified and non-allowlisted users', async () => {
  const billing = load('lib/assessmentBilling.ts', {});
  const founding = load('lib/foundingAthleteAccess.ts', {}, {
    FOUNDING_ATHLETE_EMAILS: 'athlete.one@example.com',
  });
  let rpcCalls = 0;
  const pe = load('lib/profileEntitlements.ts', {
    '@/lib/assessmentBilling': billing,
    '@/lib/foundingAthleteAccess': founding,
    '@/lib/supabase/admin': {
      createServiceClient: () => ({
        rpc: async () => { rpcCalls += 1; return { data: { ok: true }, error: null }; },
      }),
      isServiceRoleConfigured: () => true,
    },
  });
  await pe.activateFoundingAthleteIfEligible({
    id: 'u1', email: 'other@example.com', email_confirmed_at: '2026-01-01',
  });
  assert.equal(rpcCalls, 0);
  await pe.activateFoundingAthleteIfEligible({
    id: 'u1', email: 'athlete.one@example.com', email_confirmed_at: null,
  });
  assert.equal(rpcCalls, 0);
  await pe.activateFoundingAthleteIfEligible({
    id: 'u1', email: 'athlete.one@example.com', email_confirmed_at: '2026-01-01',
  });
  assert.equal(rpcCalls, 1);
});
