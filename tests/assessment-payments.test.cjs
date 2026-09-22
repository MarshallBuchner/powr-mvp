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
