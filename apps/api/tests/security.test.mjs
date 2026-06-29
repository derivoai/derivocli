/**
 * Backend security tests (Phase 11). Run with: node --test
 * Covers: auth rejection, subscription/trial logic, API key hashing,
 * validation (unknown fields / enums), rate limiting, security headers,
 * malformed input, and enumeration-safe errors. Runs in MOCK mode (no
 * Firebase), so authed routes treat any token as a mock user.
 */
import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';

import { computeSubscription } from '../dist/security/subscription.js';
import {
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  maskedPreview,
} from '../dist/security/api-keys.js';
import { schemas } from '../dist/security/validation.js';
import { createRateLimiter } from '../dist/security/rate-limit.js';
import { createApp } from '../dist/app.js';

// ── HTTP harness ─────────────────────────────────────
let server;
let base;
before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});
after(() => server?.close());

const authed = { Authorization: 'Bearer mock-token' };

// ── Subscription / trial logic ───────────────────────
test('subscription: active trial in the future is active', () => {
  const future = new Date(Date.now() + 3 * 86400000).toISOString();
  const r = computeSubscription({ plan: 'trial', status: 'active', trialEndsAt: future });
  assert.equal(r.active, true);
  assert.equal(r.isTrial, true);
  assert.ok(r.remainingDays >= 2);
});

test('subscription: expired trial is NOT active (trial bypass blocked)', () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  const r = computeSubscription({ plan: 'trial', status: 'active', trialEndsAt: past });
  assert.equal(r.active, false);
});

test('subscription: no document is not active', () => {
  assert.equal(computeSubscription(null).active, false);
});

test('subscription: canceled pro is not active', () => {
  assert.equal(computeSubscription({ plan: 'pro', status: 'canceled' }).active, false);
});

test('subscription: active pro is active', () => {
  assert.equal(computeSubscription({ plan: 'pro', status: 'active' }).active, true);
});

// ── API key security ─────────────────────────────────
test('apikey: generated key has prefix, plaintext is not the hash', () => {
  const k = generateApiKey(true);
  assert.ok(k.plaintext.startsWith('drv_live_'));
  assert.match(k.hash, /^[a-f0-9]{64}$/);
  assert.notEqual(k.plaintext, k.hash);
});

test('apikey: verify matches only the correct key (constant-time)', () => {
  const k = generateApiKey();
  assert.equal(verifyApiKey(k.plaintext, k.hash), true);
  assert.equal(verifyApiKey('drv_live_wrong', k.hash), false);
  assert.equal(hashApiKey(k.plaintext), k.hash);
});

test('apikey: masked preview never reveals the full key', () => {
  const preview = maskedPreview('drv_live_', '1a2b');
  assert.ok(preview.includes('•'));
  assert.ok(preview.endsWith('1a2b'));
});

// ── Validation ───────────────────────────────────────
test('validation: rejects unknown fields (strict schema)', () => {
  const r = schemas.createProject.safeParse({ name: 'ok', hacker: true });
  assert.equal(r.success, false);
});

test('validation: rejects invalid env enum', () => {
  const r = schemas.createProject.safeParse({ name: 'ok', env: 'Prod' });
  assert.equal(r.success, false);
});

test('validation: accepts a valid project body', () => {
  const r = schemas.createProject.safeParse({ name: 'ok', env: 'Production' });
  assert.equal(r.success, true);
});

// ── Rate limiting ────────────────────────────────────
test('rate limiter: blocks after the max is exceeded', () => {
  const limiter = createRateLimiter('test', { windowMs: 60000, max: 2 });
  const req = { headers: {}, ip: '9.9.9.9', socket: {} };
  const res = { setHeader() {} };
  const errors = [];
  const next = (e) => errors.push(e);
  limiter(req, res, next); // 1
  limiter(req, res, next); // 2
  limiter(req, res, next); // 3 -> blocked
  assert.equal(errors.filter((e) => e === undefined).length, 2);
  const blocked = errors.find((e) => e && e.status === 429);
  assert.ok(blocked, 'third request should be rate limited');
});

// ── HTTP: authentication ─────────────────────────────
test('http: protected route without token -> 401', async () => {
  const res = await fetch(`${base}/api/projects`);
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.code, 'unauthorized');
});

test('http: /api/cli/verify without token -> 401', async () => {
  const res = await fetch(`${base}/api/cli/verify`);
  assert.equal(res.status, 401);
});

test('http: /api/cli/verify with token -> 200 (mock active)', async () => {
  const res = await fetch(`${base}/api/cli/verify`, { headers: authed });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.authenticated, true);
});

// ── HTTP: validation + body limits ───────────────────
test('http: create project rejects unknown fields -> 400', async () => {
  const res = await fetch(`${base}/api/projects`, {
    method: 'POST',
    headers: { ...authed, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'ok', evil: 1 }),
  });
  assert.equal(res.status, 400);
});

test('http: create project with valid body -> 201', async () => {
  const res = await fetch(`${base}/api/projects`, {
    method: 'POST',
    headers: { ...authed, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'demo', env: 'Production' }),
  });
  assert.equal(res.status, 201);
});

test('http: malformed JSON -> 400', async () => {
  const res = await fetch(`${base}/api/projects`, {
    method: 'POST',
    headers: { ...authed, 'Content-Type': 'application/json' },
    body: '{ not json',
  });
  assert.equal(res.status, 400);
});

// ── HTTP: headers + 404 ──────────────────────────────
test('http: security headers are present', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.ok(res.headers.get('content-security-policy'));
  assert.equal(res.headers.get('x-powered-by'), null);
});

test('http: unknown route -> 404 with stable shape', async () => {
  const res = await fetch(`${base}/api/does-not-exist`);
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.code, 'not_found');
});
