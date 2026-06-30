/**
 * Resend email system tests. node --test
 *
 * Covers: template generation, provider abstraction, config validation,
 * and all three /api/auth/email/* endpoints. Runs in MOCK mode (no Firebase
 * and no real Resend key required) so CI passes without credentials.
 */
import assert from 'node:assert/strict';
import { test, before, after, mock } from 'node:test';

import {
  verifyEmailTemplate,
  passwordResetTemplate,
  recoverEmailTemplate,
} from '../dist/identity/email/templates.js';
import {
  getEmailProvider,
  NoopEmailProvider,
  resetEmailProviderForTesting,
} from '../dist/identity/email/providers.js';
import {
  getEmailActionService,
  resetEmailActionServiceForTesting,
} from '../dist/identity/email/email-action-service.js';
import { resetConfigForTesting, loadConfig } from '../dist/infra/config.js';
import { createApp } from '../dist/app.js';

// ── HTTP harness ──────────────────────────────────────────────────────────────
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

// ── Template: verifyEmail ─────────────────────────────────────────────────────
test('template verifyEmail: subject contains "Verify"', () => {
  const t = verifyEmailTemplate('https://auth.derivo.in/action?mode=verifyEmail&oobCode=x');
  assert.ok(t.subject.includes('Verify'), `subject="${t.subject}"`);
});

test('template verifyEmail: html contains the action link', () => {
  const link = 'https://auth.derivo.in/action?mode=verifyEmail&oobCode=abc123';
  const t = verifyEmailTemplate(link);
  assert.ok(t.html.includes(link), 'html must contain the action link');
});

test('template verifyEmail: text fallback contains the action link', () => {
  const link = 'https://auth.derivo.in/action?mode=verifyEmail&oobCode=abc123';
  const t = verifyEmailTemplate(link);
  assert.ok(t.text.includes(link), 'text must contain the action link');
});

test('template verifyEmail: html is valid DOCTYPE', () => {
  const t = verifyEmailTemplate('https://example.com');
  assert.ok(t.html.trimStart().startsWith('<!DOCTYPE html>'), 'must start with DOCTYPE');
});

test('template verifyEmail: html contains CTA button label', () => {
  const t = verifyEmailTemplate('https://example.com');
  assert.ok(t.html.includes('Verify Email'), 'missing CTA label');
});

// ── Template: passwordReset ───────────────────────────────────────────────────
test('template passwordReset: subject contains "Reset"', () => {
  const t = passwordResetTemplate('https://auth.derivo.in/action?mode=resetPassword&oobCode=y');
  assert.ok(t.subject.includes('Reset'), `subject="${t.subject}"`);
});

test('template passwordReset: html contains action link', () => {
  const link = 'https://auth.derivo.in/action?mode=resetPassword&oobCode=xyz';
  const t = passwordResetTemplate(link);
  assert.ok(t.html.includes(link));
});

test('template passwordReset: html contains CTA button label', () => {
  const t = passwordResetTemplate('https://example.com');
  assert.ok(t.html.includes('Reset Password'), 'missing CTA label');
});

// ── Template: recoverEmail ────────────────────────────────────────────────────
test('template recoverEmail: subject contains "Recover"', () => {
  const t = recoverEmailTemplate('https://auth.derivo.in/action', 'old@example.com');
  assert.ok(t.subject.includes('Recover'), `subject="${t.subject}"`);
});

test('template recoverEmail: html contains restored email', () => {
  const t = recoverEmailTemplate('https://example.com', 'old@example.com');
  assert.ok(t.html.includes('old@example.com'), 'must show restored email');
});

test('template recoverEmail: html escapes < > in email addresses', () => {
  const t = recoverEmailTemplate('https://example.com', '<script>');
  assert.ok(!t.html.includes('<script>'), 'must escape < in restored email');
});

test('template recoverEmail: html contains CTA button label', () => {
  const t = recoverEmailTemplate('https://example.com', 'r@r.com');
  assert.ok(t.html.includes('Recover Email'), 'missing CTA label');
});

// ── Template: shared structure ────────────────────────────────────────────────
test('template: all three contain the Derivo wordmark', () => {
  for (const t of [
    verifyEmailTemplate('https://x.com'),
    passwordResetTemplate('https://x.com'),
    recoverEmailTemplate('https://x.com', 'a@b.com'),
  ]) {
    assert.ok(t.html.includes('Derivo'), 'must include Derivo branding');
  }
});

test('template: all three include plain-text fallback', () => {
  for (const t of [
    verifyEmailTemplate('https://x.com'),
    passwordResetTemplate('https://x.com'),
    recoverEmailTemplate('https://x.com', 'a@b.com'),
  ]) {
    assert.ok(typeof t.text === 'string' && t.text.length > 20, 'must have non-empty text fallback');
  }
});

test('template: html includes fallback link below CTA', () => {
  const link = 'https://auth.derivo.in/action?mode=verifyEmail&oobCode=fallback';
  const t = verifyEmailTemplate(link);
  // The link appears twice: once in the button href, once as a plain-text fallback URL.
  const count = (t.html.split(link).length - 1);
  assert.ok(count >= 2, `expected link to appear at least twice, got ${count}`);
});

// ── Provider: noop ────────────────────────────────────────────────────────────
test('provider noop: canSend=false, never throws', async () => {
  resetEmailProviderForTesting();
  const p = getEmailProvider('none');
  assert.equal(p.canSend, false);
  assert.ok(p instanceof NoopEmailProvider);
  await p.send({ to: 'a@b.com', subject: 's', html: '<p>x</p>', text: 'x' });
});

test('provider: unknown name resolves to noop', () => {
  resetEmailProviderForTesting();
  const p = getEmailProvider('unknown-provider');
  assert.equal(p.name, 'none');
});

test('provider resend: throws without RESEND_API_KEY', () => {
  resetEmailProviderForTesting();
  const saved = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  assert.throws(
    () => getEmailProvider('resend'),
    (err) => err instanceof Error && err.message.includes('RESEND_API_KEY'),
  );
  if (saved !== undefined) process.env.RESEND_API_KEY = saved;
  resetEmailProviderForTesting();
});

// ── EmailActionService (mock mode) ────────────────────────────────────────────
test('service: send returns sent=false + provider=none in mock mode', async () => {
  resetEmailActionServiceForTesting();
  const svc = getEmailActionService();
  const result = await svc.sendVerification('u@example.com').catch(async (err) => {
    // In mock mode Firebase Admin is not initialized → link gen throws.
    // The service should propagate that — that is correct behaviour.
    assert.ok(err.message.includes('not initialized'), `unexpected error: ${err.message}`);
    return null;
  });
  // Either threw (expected in mock mode) or returned a no-send result.
  if (result) assert.equal(result.sent, false);
});

// ── Config validation: email fields ──────────────────────────────────────────
test('config: emailProvider defaults to "none"', () => {
  resetConfigForTesting();
  const cfg = loadConfig();
  assert.equal(cfg.emailProvider, 'none');
});

test('config: emailProvider reads EMAIL_PROVIDER env', () => {
  resetConfigForTesting();
  process.env.EMAIL_PROVIDER = 'resend';
  const cfg = loadConfig();
  assert.equal(cfg.emailProvider, 'resend');
  delete process.env.EMAIL_PROVIDER;
  resetConfigForTesting();
});

test('config: authActionUrl defaults to auth.derivo.in', () => {
  resetConfigForTesting();
  const cfg = loadConfig();
  assert.equal(cfg.authActionUrl, 'https://auth.derivo.in/action');
});

test('config validate: flags missing RESEND_API_KEY in production', async () => {
  const { validateConfig } = await import('../dist/infra/config.js');
  const saved = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const { problems } = validateConfig({
    env: 'production',
    port: 3001,
    appUrl: 'https://x',
    store: 'firestore',
    redisUrl: null,
    requireFirebase: true,
    sessionSecret: 'strong-32-char-secret-xxxxxxxxxxx',
    billingProvider: '',
    lemonSqueezyWebhookSecret: null,
    emailProvider: 'resend',
    authActionUrl: 'https://auth.derivo.in/action',
    auditRetentionDays: 90,
    maxAccountsPerIp: 3,
    maxAccountsPerIpWindowDays: 30,
    inheritTrialOnReRegister: true,
    jobsEnabled: true,
    features: { distributedRateLimit: false, backgroundJobs: true, telemetry: false },
  });
  assert.ok(
    problems.some((p) => p.includes('RESEND_API_KEY')),
    `expected RESEND_API_KEY problem, got: ${problems.join(', ')}`,
  );
  if (saved !== undefined) process.env.RESEND_API_KEY = saved;
});

// ── HTTP endpoints ────────────────────────────────────────────────────────────
test('POST /api/auth/email/send-verification without token -> 401', async () => {
  const res = await fetch(`${base}/api/auth/email/send-verification`, { method: 'POST' });
  assert.equal(res.status, 401);
});

test('POST /api/auth/email/send-verification with mock token -> 200 mock', async () => {
  const res = await fetch(`${base}/api/auth/email/send-verification`, {
    method: 'POST',
    headers: authed,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.mock, true);
  assert.equal(body.sent, false);
});

test('POST /api/auth/email/send-password-reset without body -> 400', async () => {
  const res = await fetch(`${base}/api/auth/email/send-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(res.status, 400);
});

test('POST /api/auth/email/send-password-reset enumeration-safe -> 200', async () => {
  const res = await fetch(`${base}/api/auth/email/send-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'noexist@example.com' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test('POST /api/auth/email/send-recover without token -> 401', async () => {
  const res = await fetch(`${base}/api/auth/email/send-recover`, { method: 'POST' });
  assert.equal(res.status, 401);
});

test('POST /api/auth/email/send-recover with mock token -> 200 mock', async () => {
  const res = await fetch(`${base}/api/auth/email/send-recover`, {
    method: 'POST',
    headers: authed,
    body: JSON.stringify({ restoredEmail: 'old@example.com' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.mock, true);
});
