/**
 * Identity & session tests (Phase 13). Run with: node --test
 * Covers: API key lifecycle + scopes, device fingerprint, session refresh
 * rotation + reuse detection + revocation, and the HTTP identity endpoints.
 */
import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';

import { generateApiKey, hashApiKey, verifyApiKey } from '../dist/security/api-keys.js';
import { buildKeyRecord, effectiveStatus, toPublic } from '../dist/identity/api-key-store.js';
import { hasScopes, normalizeScopes } from '../dist/identity/scopes.js';
import { computeFingerprint, fingerprintStrength } from '../dist/identity/fingerprint.js';
import {
  createSession,
  refreshSession,
  listSessions,
  revokeSession,
  logoutAll,
  RefreshError,
  resetSessionStoreForTesting,
} from '../dist/identity/sessions.js';
import { signAccessToken, verifyAccessToken } from '../dist/identity/token-utils.js';
import { createApp } from '../dist/app.js';

let server;
let base;
before(async () => {
  const app = createApp();
  await new Promise((r) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      r();
    });
  });
});
after(() => server?.close());
const authed = { Authorization: 'Bearer mock-token', 'Content-Type': 'application/json' };

// ── API key engine ───────────────────────────────────
test('apikey: never plaintext; hash verifies', () => {
  const k = generateApiKey(true);
  assert.ok(k.plaintext.startsWith('drv_live_'));
  assert.equal(verifyApiKey(k.plaintext, k.hash), true);
  assert.equal(verifyApiKey('drv_live_x', k.hash), false);
  assert.equal(hashApiKey(k.plaintext), k.hash);
});

test('apikey: record build carries scopes/tags/env; public hides hash', () => {
  const { record } = buildKeyRecord({
    name: 'CI',
    environment: 'test',
    permissions: ['projects:read', 'bogus', 'admin'],
    tags: ['ci'],
    createdBy: 'u1',
  });
  assert.equal(record.environment, 'test');
  assert.deepEqual(record.permissions, ['projects:read', 'admin']); // bogus dropped
  const pub = toPublic(record);
  assert.equal('hash' in pub, false);
  assert.ok(pub.preview.includes('•'));
});

test('apikey: effective status reflects expiry', () => {
  const past = new Date(Date.now() - 1000).toISOString();
  assert.equal(effectiveStatus({ status: 'active', expiresAt: past }), 'expired');
  assert.equal(effectiveStatus({ status: 'revoked', expiresAt: null }), 'revoked');
  assert.equal(effectiveStatus({ status: 'active', expiresAt: null }), 'active');
});

test('scopes: admin implies all; normalize drops invalid', () => {
  assert.equal(hasScopes(['admin'], ['projects:write', 'devices:read']), true);
  assert.equal(hasScopes(['projects:read'], ['projects:write']), false);
  assert.deepEqual(normalizeScopes(['projects:read', 'nope', 'admin']), ['projects:read', 'admin']);
});

// ── Fingerprint ───────────────────────────────────────
test('fingerprint: deterministic + needs multiple signals', () => {
  const a = computeFingerprint({ deviceId: 'd1', hostname: 'HOST', platform: 'windows', arch: 'x64' });
  const b = computeFingerprint({ deviceId: 'd1', hostname: 'host', platform: 'windows', arch: 'x64' });
  assert.equal(a, b); // hostname case-normalized
  assert.notEqual(a, computeFingerprint({ deviceId: 'd2', hostname: 'host', platform: 'windows', arch: 'x64' }));
  assert.ok(fingerprintStrength({ deviceId: 'd1', hostname: 'h' }) >= 2);
});

// ── Access token ─────────────────────────────────────
test('access token: signs and verifies; rejects tampering', () => {
  const t = signAccessToken('u1', 'sess1');
  const claims = verifyAccessToken(t);
  assert.equal(claims?.uid, 'u1');
  assert.equal(verifyAccessToken(t + 'x'), null);
  assert.equal(verifyAccessToken('a.b.c'), null);
});

// ── Sessions + refresh rotation + reuse detection ────
test('session: create + list + revoke', async () => {
  resetSessionStoreForTesting();
  const s = await createSession('u-sess', { deviceId: 'd1', deviceName: 'Laptop' });
  assert.ok(s.accessToken && s.refreshToken && s.session.id);
  let sessions = await listSessions('u-sess');
  assert.equal(sessions.length, 1);
  assert.equal(await revokeSession('u-sess', s.session.id), true);
  sessions = await listSessions('u-sess');
  assert.equal(sessions.length, 0);
});

test('refresh: rotates token (old token invalid after use)', async () => {
  resetSessionStoreForTesting();
  const s = await createSession('u-rot');
  const r1 = await refreshSession(s.refreshToken);
  assert.ok(r1.refreshToken && r1.refreshToken !== s.refreshToken);
  // new token works
  const r2 = await refreshSession(r1.refreshToken);
  assert.ok(r2.refreshToken);
});

test('refresh: REUSE of a rotated token revokes the session', async () => {
  resetSessionStoreForTesting();
  const s = await createSession('u-reuse');
  const r1 = await refreshSession(s.refreshToken); // s.refreshToken now used
  // present the original (now-used) token again -> reuse detected
  await assert.rejects(
    () => refreshSession(s.refreshToken),
    (e) => e instanceof RefreshError && e.code === 'reuse_detected',
  );
  // and the rotated token is now dead too (session revoked)
  await assert.rejects(() => refreshSession(r1.refreshToken));
});

test('refresh: invalid token rejected', async () => {
  await assert.rejects(
    () => refreshSession('drf_bogus.token'),
    (e) => e instanceof RefreshError && e.code === 'invalid',
  );
});

test('logout-all revokes every session', async () => {
  resetSessionStoreForTesting();
  await createSession('u-all');
  await createSession('u-all');
  const count = await logoutAll('u-all');
  assert.ok(count >= 2);
  assert.equal((await listSessions('u-all')).length, 0);
});

// ── HTTP endpoints ───────────────────────────────────
test('http: GET /api/keys requires auth', async () => {
  assert.equal((await fetch(`${base}/api/keys`)).status, 401);
});

test('http: create + rotate + revoke API key (mock)', async () => {
  const create = await fetch(`${base}/api/keys`, {
    method: 'POST',
    headers: authed,
    body: JSON.stringify({ name: 'CI', permissions: ['projects:read'], tags: ['ci'] }),
  });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.ok(created.key.startsWith('drv_'));
  assert.equal('hash' in created.keyRecord, false);

  const rotate = await fetch(`${base}/api/keys/${created.id}/rotate`, {
    method: 'POST',
    headers: authed,
    body: JSON.stringify({ graceSeconds: 3600 }),
  });
  assert.equal(rotate.status, 201);
  const rotated = await rotate.json();
  assert.notEqual(rotated.key, created.key);

  const revoke = await fetch(`${base}/api/keys/${created.id}/revoke`, { method: 'POST', headers: authed });
  assert.equal(revoke.status, 200);
});

test('http: session create + refresh + logout-all', async () => {
  const create = await fetch(`${base}/api/sessions`, { method: 'POST', headers: authed, body: '{}' });
  assert.equal(create.status, 201);
  const { refreshToken } = await create.json();

  const refresh = await fetch(`${base}/api/sessions/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert.equal(refresh.status, 200);
  const refreshed = await refresh.json();
  assert.ok(refreshed.refreshToken);

  // Replaying the original refresh token must fail (reuse).
  const replay = await fetch(`${base}/api/sessions/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert.equal(replay.status, 401);

  const logoutAllRes = await fetch(`${base}/api/sessions/logout-all`, { method: 'POST', headers: authed, body: '{}' });
  assert.equal(logoutAllRes.status, 200);
});

test('http: GET /api/devices and /api/login-history respond', async () => {
  for (const p of ['/api/devices', '/api/login-history', '/api/sessions']) {
    assert.equal((await fetch(`${base}${p}`, { headers: authed })).status, 200, p);
  }
});
