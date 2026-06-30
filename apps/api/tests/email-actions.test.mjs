/**
 * Email action subsystem tests. Run with: node --test
 * Covers the provider abstraction (no-op + named placeholders) and the
 * transactional auth-email endpoints. Runs in MOCK mode (no Firebase), so link
 * generation is skipped and endpoints report no-op results.
 */
import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';

import {
  getEmailProvider,
  NoopEmailProvider,
  resetEmailProviderForTesting,
} from '../dist/identity/email/providers.js';
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

// ── Provider abstraction ─────────────────────────────
test('provider: unknown/none resolves to the no-op provider', () => {
  resetEmailProviderForTesting();
  const p = getEmailProvider('none');
  assert.equal(p.name, 'none');
  assert.equal(p.canSend, false);
  assert.ok(p instanceof NoopEmailProvider);
});

test('provider: no-op send never throws and does not deliver', async () => {
  const p = getEmailProvider('none');
  await p.send({ to: 'a@b.com', subject: 's', html: '<p>x</p>', text: 'x' });
  assert.equal(p.canSend, false);
});

test('provider: named providers are placeholders that cannot send yet', async () => {
  // resend now throws at construction when RESEND_API_KEY is absent.
  // postmark and sendgrid still throw at send() since they are stubs.
  resetEmailProviderForTesting();
  assert.throws(() => getEmailProvider('resend'), /RESEND_API_KEY/i);

  for (const name of ['postmark', 'sendgrid']) {
    resetEmailProviderForTesting();
    const p = getEmailProvider(name);
    assert.equal(p.name, name);
    assert.equal(p.canSend, false);
    await assert.rejects(p.send({ to: 'a@b.com', subject: 's', html: '<p>x</p>', text: 't' }), /not implemented/i);
  }
});

// ── HTTP: verification ───────────────────────────────
test('http: send-verification without token -> 401', async () => {
  const res = await fetch(`${base}/api/auth/email/send-verification`, { method: 'POST' });
  assert.equal(res.status, 401);
});

test('http: send-verification with token (mock) -> no-op result', async () => {
  const res = await fetch(`${base}/api/auth/email/send-verification`, {
    method: 'POST',
    headers: authed,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.sent, false);
  assert.equal(body.mock, true);
});

// ── HTTP: password reset ─────────────────────────────
test('http: send-password-reset requires an email -> 400', async () => {
  const res = await fetch(`${base}/api/auth/email/send-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test('http: send-password-reset is enumeration-safe -> 200 ok', async () => {
  const res = await fetch(`${base}/api/auth/email/send-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'someone@example.com' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});
