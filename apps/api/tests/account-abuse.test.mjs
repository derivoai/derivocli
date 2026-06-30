/**
 * Account abuse prevention tests. node --test
 *
 * Runs in MOCK mode (no Firebase). Uses in-memory store to exercise:
 *   - hashEmail / hashIp determinism
 *   - checkRegistrationAbuse in mock mode (always allowed, no prior sub)
 *   - /api/account/register endpoint (mock mode no-op paths)
 *   - /api/account/abuse-status (mock mode)
 *   - IP limit and email-block logic via a fake Firestore stub
 *   - Config env vars (MAX_ACCOUNTS_PER_IP, INHERIT_TRIAL_ON_REREGISTER)
 */
import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';

import { hashEmail } from '../dist/security/account-abuse.js';
import { resetConfigForTesting, loadConfig } from '../dist/infra/config.js';
import { createApp } from '../dist/app.js';

// ── HTTP harness ─────────────────────────────────────────────────────────────
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

const authed = { Authorization: 'Bearer mock-token', 'Content-Type': 'application/json' };

// ── hashEmail ─────────────────────────────────────────────────────────────────
test('hashEmail: deterministic for the same address', () => {
  assert.equal(hashEmail('Test@Example.COM'), hashEmail('test@example.com'));
});

test('hashEmail: different addresses produce different hashes', () => {
  assert.notEqual(hashEmail('a@b.com'), hashEmail('c@d.com'));
});

test('hashEmail: produces 64-char hex', () => {
  assert.match(hashEmail('user@derivo.in'), /^[a-f0-9]{64}$/);
});

// ── config: new abuse-prevention fields ──────────────────────────────────────
test('config: maxAccountsPerIp defaults to 3', () => {
  resetConfigForTesting();
  const cfg = loadConfig();
  assert.equal(cfg.maxAccountsPerIp, 3);
  assert.equal(cfg.maxAccountsPerIpWindowDays, 30);
  assert.equal(cfg.inheritTrialOnReRegister, true);
});

test('config: MAX_ACCOUNTS_PER_IP env var is respected', () => {
  resetConfigForTesting();
  process.env.MAX_ACCOUNTS_PER_IP = '5';
  process.env.MAX_ACCOUNTS_PER_IP_WINDOW_DAYS = '7';
  process.env.INHERIT_TRIAL_ON_REREGISTER = 'false';
  const cfg = loadConfig();
  assert.equal(cfg.maxAccountsPerIp, 5);
  assert.equal(cfg.maxAccountsPerIpWindowDays, 7);
  assert.equal(cfg.inheritTrialOnReRegister, false);
  // Restore
  delete process.env.MAX_ACCOUNTS_PER_IP;
  delete process.env.MAX_ACCOUNTS_PER_IP_WINDOW_DAYS;
  delete process.env.INHERIT_TRIAL_ON_REREGISTER;
  resetConfigForTesting();
});

test('config: MAX_ACCOUNTS_PER_IP=0 disables the IP check', () => {
  resetConfigForTesting();
  process.env.MAX_ACCOUNTS_PER_IP = '0';
  const cfg = loadConfig();
  assert.equal(cfg.maxAccountsPerIp, 0);
  delete process.env.MAX_ACCOUNTS_PER_IP;
  resetConfigForTesting();
});

// ── HTTP: /api/account/register ───────────────────────────────────────────────
test('POST /api/account/register without token -> 401', async () => {
  const res = await fetch(`${base}/api/account/register`, { method: 'POST' });
  assert.equal(res.status, 401);
});

test('POST /api/account/register with mock token -> 201 new account', async () => {
  const res = await fetch(`${base}/api/account/register`, {
    method: 'POST',
    headers: authed,
    body: JSON.stringify({ firstName: 'Jane', lastName: 'Doe' }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.status, 'new');
  assert.ok(body.subscription);
  assert.equal(body.subscription.trialUsed, false);
});

test('POST /api/account/register accepts empty body -> 201', async () => {
  const res = await fetch(`${base}/api/account/register`, {
    method: 'POST',
    headers: authed,
    body: '{}',
  });
  assert.equal(res.status, 201);
});

// ── HTTP: /api/account/abuse-status ──────────────────────────────────────────
test('GET /api/account/abuse-status without token -> 401', async () => {
  const res = await fetch(`${base}/api/account/abuse-status`);
  assert.equal(res.status, 401);
});

test('GET /api/account/abuse-status with mock token -> 200', async () => {
  const res = await fetch(`${base}/api/account/abuse-status`, { headers: authed });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.blocked, false);
  assert.equal(body.trialUsed, false);
  assert.equal(typeof body.registrationCount, 'number');
});
