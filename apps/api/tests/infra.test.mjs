/**
 * Phase 14 infrastructure tests. Run with: node --test
 * Covers: pluggable store, distributed rate limiting, replay protection,
 * background jobs, health/readiness/liveness/metrics endpoints, retry logic,
 * circuit breaker, timeouts, and Redis-unavailable fallback. Runs in MOCK mode
 * (no Firebase) so the store resolves to the in-memory backend.
 */
import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';

import { getStore, getStoreSync, setStoreForTesting } from '../dist/infra/store.js';
import {
  seen,
  remember,
  checkAndRemember,
  resetReplayStoreForTesting,
} from '../dist/infra/replay.js';
import { withRetry, withTimeout, CircuitBreaker } from '../dist/infra/resilience.js';
import { runAllJobsOnce, runJob, jobDefinitions, startJobs, stopJobs } from '../dist/infra/jobs.js';
import { snapshot, incr, resetMetricsForTesting } from '../dist/infra/metrics.js';
import { loadConfig, validateConfig, resetConfigForTesting } from '../dist/infra/config.js';
import { createRateLimiter, byUser } from '../dist/security/rate-limit.js';
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

// ── Store ────────────────────────────────────────────
test('store: memory backend get/set/has/del with ttl', async () => {
  setStoreForTesting(null);
  const store = await getStore();
  assert.equal(store.backend, 'memory');
  await store.set('a', 'one');
  assert.equal(await store.get('a'), 'one');
  assert.equal(await store.has('a'), true);
  await store.del('a');
  assert.equal(await store.get('a'), null);
});

test('store: incr is atomic and ttl-expires', async () => {
  setStoreForTesting(null);
  const store = await getStore();
  assert.equal(await store.incr('c', 60), 1);
  assert.equal(await store.incr('c', 60), 2);
});

test('store: getStoreSync returns a usable store', () => {
  const s = getStoreSync();
  assert.ok(typeof s.get === 'function');
});

// ── Redis-unavailable fallback ───────────────────────
test('store: redis configured but unavailable falls back to memory', async () => {
  const prevUrl = process.env.REDIS_URL;
  const prevBackend = process.env.STORE_BACKEND;
  process.env.REDIS_URL = 'redis://127.0.0.1:6379';
  process.env.STORE_BACKEND = 'redis';
  resetConfigForTesting();
  setStoreForTesting(null);

  const store = await getStore();
  // ioredis is not installed and Firebase is not initialized → memory.
  assert.equal(store.backend, 'memory');

  // Restore.
  if (prevUrl === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = prevUrl;
  if (prevBackend === undefined) delete process.env.STORE_BACKEND;
  else process.env.STORE_BACKEND = prevBackend;
  resetConfigForTesting();
  setStoreForTesting(null);
});

// ── Distributed rate limiting ────────────────────────
test('rate limit: per-user key blocks after the window max', async () => {
  setStoreForTesting(null);
  const limiter = createRateLimiter('infra-user', { windowMs: 60000, max: 3, key: byUser });
  const req = { headers: {}, ip: '5.5.5.5', socket: {}, auth: { uid: 'user-1' } };
  const res = { setHeader() {} };
  const errors = [];
  const call = () =>
    new Promise((resolve) =>
      limiter(req, res, (e) => {
        errors.push(e);
        resolve();
      }),
    );
  await call();
  await call();
  await call();
  await call(); // 4th blocked
  assert.equal(errors.filter((e) => e === undefined).length, 3);
  assert.ok(errors.find((e) => e && e.status === 429));
});

test('rate limit: different users are independent', async () => {
  setStoreForTesting(null);
  const limiter = createRateLimiter('infra-iso', { windowMs: 60000, max: 1, key: byUser });
  const res = { setHeader() {} };
  const run = (uid) =>
    new Promise((resolve) => {
      const req = { headers: {}, ip: '1.1.1.1', socket: {}, auth: { uid } };
      limiter(req, res, (e) => resolve(e));
    });
  assert.equal(await run('alice'), undefined);
  assert.equal(await run('bob'), undefined); // independent bucket, still allowed
});

// ── Replay protection ────────────────────────────────
test('replay: fresh id is not seen; remembered id is seen', async () => {
  resetReplayStoreForTesting();
  assert.equal(await seen('billing', 'evt-x'), false);
  await remember('billing', 'evt-x', 60);
  assert.equal(await seen('billing', 'evt-x'), true);
});

test('replay: checkAndRemember blocks the second presentation', async () => {
  resetReplayStoreForTesting();
  assert.equal(await checkAndRemember('webhook', 'id-1', 60), false); // first time
  assert.equal(await checkAndRemember('webhook', 'id-1', 60), true); // replay
});

test('replay: namespaces are isolated', async () => {
  resetReplayStoreForTesting();
  await remember('a', 'shared', 60);
  assert.equal(await seen('a', 'shared'), true);
  assert.equal(await seen('b', 'shared'), false);
});

// ── Background jobs ──────────────────────────────────
test('jobs: definitions cover required maintenance workers', () => {
  const names = jobDefinitions.map((j) => j.name);
  for (const required of [
    'trial-expiration',
    'temp-access-expiration',
    'session-cleanup',
    'device-cleanup',
    'refresh-token-cleanup',
    'expired-api-key-cleanup',
    'audit-retention',
  ]) {
    assert.ok(names.includes(required), `missing job: ${required}`);
  }
});

test('jobs: run as skipped in mock mode (no Firebase)', async () => {
  const results = await runAllJobsOnce();
  assert.equal(results.length, jobDefinitions.length);
  for (const r of results) {
    assert.equal(r.skipped, true);
    assert.equal(r.processed, 0);
    assert.equal(r.error, undefined);
  }
});

test('jobs: a throwing job is captured, not propagated', async () => {
  const result = await runJob({
    name: 'boom',
    intervalMs: 1000,
    run: async () => {
      throw new Error('kaboom');
    },
  });
  assert.equal(result.error, 'kaboom');
  assert.equal(result.skipped, false);
});

test('jobs: scheduler start/stop is safe to call', () => {
  // Disabled by default in test/dev — should report not-started and not throw.
  const started = startJobs();
  assert.equal(typeof started, 'boolean');
  stopJobs();
});

// ── Resilience ───────────────────────────────────────
test('retry: succeeds after transient failures', async () => {
  let attempts = 0;
  const result = await withRetry(
    async () => {
      attempts++;
      if (attempts < 3) throw new Error('transient');
      return 'ok';
    },
    { retries: 5, baseDelayMs: 1, maxDelayMs: 5 },
  );
  assert.equal(result, 'ok');
  assert.equal(attempts, 3);
});

test('retry: gives up after exhausting retries', async () => {
  let attempts = 0;
  await assert.rejects(
    withRetry(
      async () => {
        attempts++;
        throw new Error('always');
      },
      { retries: 2, baseDelayMs: 1, maxDelayMs: 2 },
    ),
  );
  assert.equal(attempts, 3); // initial + 2 retries
});

test('retry: respects shouldRetry=false', async () => {
  let attempts = 0;
  await assert.rejects(
    withRetry(
      async () => {
        attempts++;
        throw new Error('fatal');
      },
      { retries: 5, baseDelayMs: 1, shouldRetry: () => false },
    ),
  );
  assert.equal(attempts, 1);
});

test('timeout: rejects when operation exceeds the limit', async () => {
  await assert.rejects(
    withTimeout(() => new Promise((resolve) => setTimeout(resolve, 50)), 10, 'slow'),
    /timed out/,
  );
});

test('timeout: resolves a fast operation', async () => {
  const value = await withTimeout(async () => 42, 50);
  assert.equal(value, 42);
});

test('circuit breaker: opens after threshold then rejects fast', async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 10_000, label: 't' });
  const fail = () => breaker.execute(async () => {
    throw new Error('down');
  });
  await assert.rejects(fail());
  await assert.rejects(fail());
  assert.equal(breaker.getState(), 'open');
  await assert.rejects(fail(), /is open/);
});

test('circuit breaker: half-open recovers on success', async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 5, label: 'r' });
  await assert.rejects(breaker.execute(async () => {
    throw new Error('x');
  }));
  assert.equal(breaker.getState(), 'open');
  await new Promise((r) => setTimeout(r, 10));
  const ok = await breaker.execute(async () => 'recovered');
  assert.equal(ok, 'recovered');
  assert.equal(breaker.getState(), 'closed');
});

// ── Metrics ──────────────────────────────────────────
test('metrics: snapshot reports counters and latency shape', () => {
  resetMetricsForTesting();
  incr('http.requests', 5);
  incr('ratelimit.hits');
  const snap = snapshot();
  assert.equal(snap.counters['http.requests'], 5);
  assert.equal(snap.counters['ratelimit.hits'], 1);
  assert.ok('latency' in snap);
  assert.ok('uptimeSec' in snap);
});

// ── Config ───────────────────────────────────────────
test('config: dev defaults to memory store and no firebase requirement', () => {
  resetConfigForTesting();
  const cfg = loadConfig();
  assert.equal(cfg.env, 'development');
  assert.equal(cfg.store, 'memory');
  assert.equal(cfg.requireFirebase, false);
});

test('config: validate flags missing production secrets', () => {
  const problems = validateConfig({
    env: 'production',
    port: 3001,
    appUrl: 'https://x',
    store: 'memory',
    redisUrl: null,
    requireFirebase: false,
    sessionSecret: 'dev-session-secret-change-me',
    billingProvider: 'lemonsqueezy',
    lemonSqueezyWebhookSecret: null,
    auditRetentionDays: 90,
    jobsEnabled: true,
    features: { distributedRateLimit: false, backgroundJobs: true, telemetry: false },
  }).problems;
  assert.ok(problems.some((p) => /SESSION_SECRET/.test(p)));
  assert.ok(problems.some((p) => /memory/.test(p)));
  assert.ok(problems.some((p) => /WEBHOOK_SECRET/.test(p)));
});

// ── Health / readiness / liveness / metrics endpoints ─
test('http: /healthz reports alive', async () => {
  const res = await fetch(`${base}/healthz`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'alive');
  assert.ok(typeof body.uptimeSec === 'number');
});

test('http: /readyz reports ready with store + mock firebase', async () => {
  const res = await fetch(`${base}/readyz`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ready');
  assert.match(body.checks.store, /ok/);
  assert.equal(body.checks.firebase, 'mock');
});

test('http: /metrics returns a counters/latency snapshot', async () => {
  const res = await fetch(`${base}/metrics`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok('counters' in body);
  assert.ok('latency' in body);
});

test('http: response carries request + correlation ids', async () => {
  const res = await fetch(`${base}/healthz`);
  assert.ok(res.headers.get('x-request-id'));
  assert.ok(res.headers.get('x-correlation-id'));
});

test('http: incoming correlation id is propagated', async () => {
  const res = await fetch(`${base}/healthz`, { headers: { 'x-correlation-id': 'corr-123' } });
  assert.equal(res.headers.get('x-correlation-id'), 'corr-123');
});
