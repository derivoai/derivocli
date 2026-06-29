/**
 * Billing & subscription tests (Phase 12). Run with: node --test
 * Covers: subscription/trial evaluation, grace period, cancellation, temporary
 * access, plan limits, feature gates, provider webhook verification, replay
 * rejection, and the entitlement HTTP endpoints.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test, before, after } from 'node:test';

import {
  evaluateSubscription,
  looseDocToRecord,
} from '../dist/billing/subscription-service.js';
import { getPlan, normalizePlanId } from '../dist/billing/plans.js';
import { MockProvider, LemonSqueezyProvider } from '../dist/billing/providers/index.js';
import {
  applyBillingEvent,
  resetProcessedEventsForTesting,
} from '../dist/billing/license-sync.js';
import { setBillingProviderForTesting } from '../dist/billing/providers/index.js';
import { createApp } from '../dist/app.js';

const iso = (deltaMs) => new Date(Date.now() + deltaMs).toISOString();
const DAY = 86_400_000;

// ── HTTP harness (mock mode) ─────────────────────────
let server;
let base;
before(async () => {
  setBillingProviderForTesting(new MockProvider('test-secret'));
  const app = createApp();
  await new Promise((r) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      r();
    });
  });
});
after(() => {
  server?.close();
  setBillingProviderForTesting(null);
});
const authed = { Authorization: 'Bearer mock-token' };

// ── Subscription evaluation ──────────────────────────
test('eval: active pro is active', () => {
  const s = evaluateSubscription({ uid: 'u', planId: 'pro', status: 'active', currentPeriodEnd: iso(30 * DAY) });
  assert.equal(s.active, true);
  assert.equal(s.planId, 'pro');
});

test('eval: expired trial is not active', () => {
  const s = evaluateSubscription({ uid: 'u', planId: 'trial', status: 'trialing', trialEndsAt: iso(-DAY) });
  assert.equal(s.active, false);
  assert.equal(s.status, 'expired');
});

test('eval: active trial reports remaining days/hours', () => {
  const s = evaluateSubscription({ uid: 'u', planId: 'trial', status: 'trialing', trialEndsAt: iso(3 * DAY) });
  assert.equal(s.active, true);
  assert.equal(s.isTrial, true);
  assert.ok(s.remainingDays >= 2);
  assert.ok(s.remainingHours >= 48);
});

test('eval: cancelled but within period is still active', () => {
  const s = evaluateSubscription({ uid: 'u', planId: 'pro', status: 'cancelled', currentPeriodEnd: iso(5 * DAY) });
  assert.equal(s.active, true);
  assert.equal(s.status, 'cancelled');
});

test('eval: cancelled after period is not active', () => {
  const s = evaluateSubscription({ uid: 'u', planId: 'pro', status: 'cancelled', currentPeriodEnd: iso(-DAY) });
  assert.equal(s.active, false);
});

test('eval: grace period within window is active', () => {
  const s = evaluateSubscription({ uid: 'u', planId: 'pro', status: 'grace', gracePeriodEndsAt: iso(2 * DAY) });
  assert.equal(s.active, true);
  assert.equal(s.inGrace, true);
});

test('eval: temporary admin access grants access', () => {
  const s = evaluateSubscription({ uid: 'u', planId: 'free', status: 'expired', temporaryAccessUntil: iso(DAY) });
  assert.equal(s.active, true);
});

test('eval: no record -> free, not active', () => {
  const s = evaluateSubscription(null);
  assert.equal(s.active, false);
  assert.equal(s.planId, 'free');
});

// ── Legacy normalization ─────────────────────────────
test('loose doc: legacy trial stored as status:active normalizes + expires', () => {
  const active = evaluateSubscription(looseDocToRecord('u', { plan: 'trial', status: 'active', trialEndsAt: iso(2 * DAY) }));
  assert.equal(active.active, true);
  const expired = evaluateSubscription(looseDocToRecord('u', { plan: 'trial', status: 'active', trialEndsAt: iso(-DAY) }));
  assert.equal(expired.active, false);
});

// ── Plans / limits ───────────────────────────────────
test('plans: free limits are bounded; pro is unlimited', () => {
  assert.equal(getPlan('free').limits.projects, 3);
  assert.equal(getPlan('pro').limits.projects, -1);
  assert.equal(normalizePlanId('pro_trial'), 'trial');
  assert.equal(normalizePlanId('paid'), 'pro');
});

// ── Providers ────────────────────────────────────────
test('mock provider: verifies the shared-secret header', () => {
  const p = new MockProvider('s3cr3t');
  assert.equal(p.verifyWebhook(Buffer.from('{}'), { 'x-mock-signature': 's3cr3t' }), true);
  assert.equal(p.verifyWebhook(Buffer.from('{}'), { 'x-mock-signature': 'wrong' }), false);
});

test('lemonsqueezy provider: HMAC signature verification', () => {
  const secret = 'whsec_test';
  const provider = new LemonSqueezyProvider(secret);
  const body = Buffer.from(JSON.stringify({ meta: { event_name: 'subscription_created', custom_data: { uid: 'u1' } }, data: { id: '99', attributes: { renews_at: iso(30 * DAY) } } }));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(provider.verifyWebhook(body, { 'x-signature': sig }), true);
  assert.equal(provider.verifyWebhook(body, { 'x-signature': 'deadbeef' }), false);
  const event = provider.parseWebhook(body, { 'x-signature': sig });
  assert.equal(event.type, 'subscription.created');
  assert.equal(event.uid, 'u1');
});

// ── License sync + replay ────────────────────────────
test('license sync: applies once, rejects replay', async () => {
  resetProcessedEventsForTesting();
  const event = { eventId: 'evt_1', type: 'subscription.created', provider: 'mock', uid: 'u-replay', planId: 'pro', currentPeriodEnd: iso(30 * DAY) };
  const first = await applyBillingEvent(event);
  assert.equal(first.applied, true);
  const second = await applyBillingEvent(event);
  assert.equal(second.applied, false);
  assert.equal(second.duplicate, true);
});

test('license sync: event without uid is not applied', async () => {
  const r = await applyBillingEvent({ eventId: 'evt_no_uid', type: 'subscription.created', provider: 'mock' });
  assert.equal(r.applied, false);
});

// ── HTTP: webhook ────────────────────────────────────
test('http: webhook with valid signature -> 200 applied', async () => {
  resetProcessedEventsForTesting();
  const res = await fetch(`${base}/api/billing/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-mock-signature': 'test-secret' },
    body: JSON.stringify({ eventId: 'http_1', type: 'subscription.created', uid: 'u-http', planId: 'pro', currentPeriodEnd: iso(30 * DAY) }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.received, true);
  assert.equal(body.applied, true);
});

test('http: webhook with invalid signature -> 401', async () => {
  const res = await fetch(`${base}/api/billing/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-mock-signature': 'WRONG' },
    body: JSON.stringify({ eventId: 'http_bad', type: 'subscription.created', uid: 'x' }),
  });
  assert.equal(res.status, 401);
});

test('http: webhook replay -> received but duplicate', async () => {
  resetProcessedEventsForTesting();
  const payload = JSON.stringify({ eventId: 'http_replay', type: 'subscription.created', uid: 'u-r', planId: 'pro', currentPeriodEnd: iso(30 * DAY) });
  const headers = { 'Content-Type': 'application/json', 'x-mock-signature': 'test-secret' };
  const first = await (await fetch(`${base}/api/billing/webhook`, { method: 'POST', headers, body: payload })).json();
  assert.equal(first.applied, true);
  const second = await (await fetch(`${base}/api/billing/webhook`, { method: 'POST', headers, body: payload })).json();
  assert.equal(second.duplicate, true);
});

// ── HTTP: entitlement endpoints ──────────────────────
test('http: GET /api/subscription requires auth', async () => {
  assert.equal((await fetch(`${base}/api/subscription`)).status, 401);
});

test('http: GET /api/subscription returns state', async () => {
  const res = await fetch(`${base}/api/subscription`, { headers: authed });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(typeof body.active, 'boolean');
  assert.ok(body.planId);
});

test('http: GET /api/usage, /api/limits, /api/features respond', async () => {
  for (const path of ['/api/usage', '/api/limits', '/api/features']) {
    const res = await fetch(`${base}${path}`, { headers: authed });
    assert.equal(res.status, 200, `${path} should be 200`);
  }
});
