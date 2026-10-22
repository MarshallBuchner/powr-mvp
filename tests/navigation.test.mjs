import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function render(file, auth, pathname = '/') {
  const exports = {};
  const mocks = {
    'next/link': ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children),
    'next/navigation': { usePathname: () => pathname },
    './AuthProvider': { useAuth: () => auth },
    './BetaBadge': () => null,
  };
  const code = ts.transpileModule(fs.readFileSync(new URL(`../app/components/${file}.tsx`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => name in mocks ? mocks[name] : require(name) });
  return renderToStaticMarkup(React.createElement(exports.default));
}

test('guest header exposes Assess, Pricing, Sign in without private or legal links', () => {
  const html = render('AccountBar', { loading: false, user: null });
  assert.deepEqual([...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]), ['/', '/#start-assessment', '/pricing', '/login']);
  assert.doesNotMatch(html, /Founder|My Assessments|Sign out|Privacy|Terms/);
});

test('authenticated header exposes Account and My Assessments without sign out or founder status', () => {
  const html = render('AccountBar', { loading: false, user: { id: 'member' } });
  assert.deepEqual([...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]), ['/', '/#start-assessment', '/assessments', '/pricing', '/account']);
  assert.doesNotMatch(html, /Founder|Sign out|Privacy|Terms|Sign in/);
});

test('loading header does not flash private navigation', () => {
  assert.doesNotMatch(render('AccountBar', { loading: true, user: null }), /href="\/(account|assessments|login)"/);
});

test('footer exposes consent controls for guests and preserves recruit chrome', () => {
  const html = render('SiteFooter', {});
  for (const path of ['/privacy', '/terms', '/privacy/settings']) assert.ok(html.includes(`href="${path}"`));
  assert.equal(render('SiteFooter', {}, '/recruit'), '');
  assert.equal(render('AccountBar', { user: null }, '/recruit'), '');
});
