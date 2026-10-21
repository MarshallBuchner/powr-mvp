/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS route harness, same as tests/assessment-payments.test.cjs */
// Route-level tests for /api/analyze persistence + idempotent replay.
// Real billing/quality libs are transpiled; OpenAI, Supabase and profile
// balance are in-memory fakes so we can count model calls and charges.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');

const ROOT = path.join(__dirname, '..');
const logs = [];
const fakeConsole = {
  error: (...a) => logs.push(['error', ...a]),
  warn: (...a) => logs.push(['warn', ...a]),
  info: (...a) => logs.push(['info', ...a]),
  log: () => {},
};

function load(file, mocks, env, cache = new Map()) {
  const abs = path.join(ROOT, file);
  if (cache.has(abs)) return cache.get(abs);
  const exports = {};
  cache.set(abs, exports);
  const js = ts.transpileModule(fs.readFileSync(abs, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const req = (name) => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/')) return load(name.slice(2) + '.ts', mocks, env, cache);
    return require(name);
  };
  vm.runInNewContext(js, { exports, require: req, process: { env }, console: fakeConsole, Date, URL, setTimeout }, { filename: abs });
  return exports;
}

function fakeDb({ missingTable = false } = {}) {
  const tables = { shared_reports: [], analysis_results: [] };
  const ops = [];
  const missing = (t) => missingTable && t === 'analysis_results';
  const err = { code: '42P01', message: 'relation does not exist' };
  return {
    tables, ops,
    from(t) {
      return {
        select() {
          const filters = [];
          const q = {
            eq(col, val) { filters.push([col, val]); return q; },
            async maybeSingle() {
              ops.push(['select', t]);
              if (missing(t)) return { data: null, error: err };
              const row = tables[t].find((r) => filters.every(([c, v]) => r[c] === v));
              return { data: row ? { ...row } : null, error: null };
            },
          };
          return q;
        },
        async upsert(row) {
          ops.push(['upsert', t, row.status]);
          if (missing(t)) return { error: err };
          const i = tables[t].findIndex((r) => r.attempt_id === row.attempt_id);
          if (i >= 0) tables[t][i] = { ...tables[t][i], ...row };
          else tables[t].push({ created_at: new Date().toISOString(), ...row });
          return { error: null };
        },
        insert(row) {
          return {
            select() {
              return {
                async single() {
                  ops.push(['insert', t]);
                  tables[t].push(row);
                  return { data: { share_token: row.share_token }, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
}

const modelOutput = {
  overallScore: 72, summary: 'Solid base.', strengths: ['Balance', 'Arm drive'],
  priorityImprovement: 'Deeper knee bend', whyItMatters: 'Power',
  movementMetrics: [
    { title: 'Stance', score: 70, explanation: 'ok', observations: [{ type: 'good', text: 'Low' }], whyItMatters: 'x' },
    { title: 'Stride', score: 66, explanation: 'ok', observations: [{ type: 'improve', text: 'Extend' }], whyItMatters: 'x' },
    { title: 'Posture', score: 74, explanation: 'ok', observations: [{ type: 'good', text: 'Upright' }], whyItMatters: 'x' },
  ],
  drills: [{ title: 'C-cuts', description: 'Edges', duration: '5 min' }],
  confidence: { score: 70, label: 'Moderate', reason: 'Clear side view' },
  assessmentUsable: true, usabilityReason: '',
};

function setup({ authed = false, missingTable = false, persistDelayMs = 0, balance = 1 } = {}) {
  const counters = { openai: 0, consumes: 0, persistDone: false };
  const db = fakeDb({ missingTable });
  let free = balance;
  class OpenAI {
    constructor() {
      this.responses = { create: async () => { counters.openai++; return { output_text: JSON.stringify(modelOutput) }; } };
    }
  }
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'a@b.test' };
  const admin = {
    createServiceClient: () => {
      if (!persistDelayMs) return db;
      return { ...db, from: (t) => {
        const q = db.from(t);
        if (t !== 'shared_reports') return q;
        return { ...q, insert: (row) => ({ select: () => ({ single: async () => {
          await new Promise((r) => setTimeout(r, persistDelayMs));
          const out = await q.insert(row).select().single();
          counters.persistDone = true;
          return out;
        } }) }) };
      } };
    },
    isServiceRoleConfigured: () => true,
  };
  const state = () => ({ freeUsed: 1 - free, credits: 0, unlockedSessionIds: [] });
  const mocks = {
    openai: OpenAI,
    '@/lib/supabase/admin': admin,
    '@/lib/supabase/config': { isSupabaseConfigured: () => authed },
    '@/lib/supabase/server': {
      createClient: async () => ({
        auth: { getUser: async () => ({ data: { user: authed ? user : null } }) },
        from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
      }),
    },
    '@/lib/profileEntitlements': {
      readProfileEntitlementBundle: async () => ({ state: state(), founding: null }),
      canRunWithFounding: (s) => 1 - s.freeUsed + s.credits > 0,
      remainingWithFounding: (s) => Math.max(0, 1 - s.freeUsed) + s.credits,
      consumeProfileAssessment: async () => { counters.consumes++; free -= 1; return { ok: true, state: state(), founding: null, remaining: free }; },
    },
  };
  const route = load('app/api/analyze/route.ts', mocks, { OPENAI_API_KEY: 'sk-test', MEASUREMENT_SECRET: 'x'.repeat(40) });
  return { route, db, counters, user };
}

const FRAME = 'data:image/jpeg;base64,' + '/9j/'.padEnd(4000, 'A');
const ATTEMPT = '22222222-2222-4222-8222-222222222222';
const DEVICE = '33333333-3333-4333-8333-333333333333';

function post(body, cookie) {
  const headers = { 'content-type': 'application/json', 'idempotency-key': body.attemptId || '' };
  if (cookie) headers.cookie = cookie;
  return new NextRequest('https://powr.test/api/analyze', { method: 'POST', body: JSON.stringify(body), headers });
}
const analyzeBody = (extra = {}) => ({ frames: [FRAME, FRAME, FRAME, FRAME, FRAME], goal: 'Acceleration', fileName: 'clip.mov', duration: 13, attemptId: ATTEMPT, deviceKey: DEVICE, ...extra });

test('success persists report + share link before responding and returns sharePath', async () => {
  const { route, db, counters } = setup({ authed: true, persistDelayMs: 30 });
  const res = await route.POST(post(analyzeBody()));
  assert.equal(counters.persistDone, true, 'response must wait for persistence');
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.match(json.sharePath, /^\/r\/s\/[a-f0-9]{48}$/);
  assert.equal(db.tables.shared_reports.length, 1);
  const row = db.tables.analysis_results.find((r) => r.attempt_id === ATTEMPT);
  assert.equal(row.status, 'completed');
  assert.equal(row.share_token, json.shareToken);
  assert.equal(counters.openai, 1);
  assert.equal(counters.consumes, 1);
});

test('idempotent replay (signed-in): same attempt id → stored report, no OpenAI call, no second charge', async () => {
  const { route, counters } = setup({ authed: true });
  const first = await (await route.POST(post(analyzeBody()))).json();
  const res = await route.POST(post(analyzeBody()));
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.replayed, true);
  assert.equal(json.sharePath, first.sharePath);
  assert.equal(json.analysis.overallScore, 72);
  assert.equal(counters.openai, 1, 'no second model call');
  assert.equal(counters.consumes, 1, 'no second charge');
  assert.equal(json.remaining, 0, 'balance reflects the single charge');
});

test('replay works even after the last credit was spent (checked before the 402 gate)', async () => {
  const { route, counters } = setup({ authed: true, balance: 1 });
  await route.POST(post(analyzeBody()));
  const res = await route.POST(post({ attemptId: ATTEMPT, deviceKey: DEVICE, replayOnly: true }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).replayed, true);
  assert.equal(counters.consumes, 1);
});

test('guest replay: matching device key replays without touching the entitlement cookie', async () => {
  const { route, counters } = setup({ authed: false });
  const r1 = await route.POST(post(analyzeBody()));
  assert.equal(r1.status, 200);
  const cookie = r1.headers.get('set-cookie');
  assert.ok(cookie, 'first call writes the consumed guest entitlement');
  const r2 = await route.POST(post({ attemptId: ATTEMPT, deviceKey: DEVICE, replayOnly: true }));
  const j2 = await r2.json();
  assert.equal(j2.replayed, true);
  assert.equal(counters.openai, 1);
  assert.equal(r2.headers.get('set-cookie'), null, 'replay never writes/decrements entitlements');
});

test('access control: a different device/user cannot replay someone else\'s attempt', async () => {
  const { route, counters } = setup({ authed: false });
  await route.POST(post(analyzeBody()));
  const other = await route.POST(post({ attemptId: ATTEMPT, deviceKey: '44444444-4444-4444-8444-444444444444', replayOnly: true }));
  assert.equal(other.status, 409);
  assert.equal((await other.json()).error, 'attempt_conflict');
  assert.equal(counters.openai, 1);
});

test('replayOnly for an unknown attempt → 404, never analyzes or charges', async () => {
  const { route, counters } = setup({ authed: true });
  const res = await route.POST(post({ attemptId: ATTEMPT, deviceKey: DEVICE, replayOnly: true }));
  assert.equal(res.status, 404);
  assert.equal(counters.openai, 0);
  assert.equal(counters.consumes, 0);
});

test('concurrent duplicate while first is in progress → 409, no second model call', async () => {
  const { route, db, counters } = setup({ authed: true });
  db.tables.analysis_results.push({ attempt_id: ATTEMPT, status: 'in_progress', owner_user_id: '11111111-1111-4111-8111-111111111111', device_key_hash: null, report: null, share_token: null, created_at: new Date().toISOString() });
  const res = await route.POST(post(analyzeBody()));
  assert.equal(res.status, 409);
  assert.equal((await res.json()).error, 'analysis_in_progress');
  assert.equal(counters.openai, 0);
  assert.equal(counters.consumes, 0);
});

test('migration not applied: analysis still runs, billed exactly once, share link still returned', async () => {
  const { route, counters } = setup({ authed: true, missingTable: true });
  const res = await route.POST(post(analyzeBody()));
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.match(json.sharePath, /^\/r\/s\//);
  assert.equal(counters.openai, 1);
  assert.equal(counters.consumes, 1);
  assert.ok(logs.some((l) => l[0] === 'warn' && String(l[1]).includes('analysis_results')));
});

test('no attempt id (old clients): unchanged behaviour, billed once', async () => {
  const { route, counters } = setup({ authed: true });
  const res = await route.POST(post(analyzeBody({ attemptId: undefined })));
  assert.equal(res.status, 200);
  assert.equal(counters.consumes, 1);
});

test('migration SQL: unique attempt id, RLS on, no client grants or policies', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20261021_analysis_results.sql'), 'utf8');
  assert.match(sql, /attempt_id uuid not null unique/);
  assert.match(sql, /alter table public\.analysis_results enable row level security/);
  assert.match(sql, /revoke all on table public\.analysis_results from anon, authenticated/);
  assert.doesNotMatch(sql, /create policy/i);
});
