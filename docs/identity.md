# Derivo Identity & Session Architecture (Phase 13)

Identity (API keys, devices, sessions) is fully manageable, revocable, and
auditable. The backend is the only source of truth.

## API key lifecycle

`identity/api-key-store.ts` + `routes/keys.ts`:
- **Create** — CSPRNG key `drv_live_…` / `drv_test_…`; only the SHA-256 **hash**
  is stored, plus `prefix`, `last4`, `permissions` (scopes), `tags`,
  `environment`, `createdBy`, `expiresAt`. Plaintext returned **once**.
- **List / Get** — returns a public projection (`preview`, never the hash).
- **Rename / Disable / Re-enable** — `PATCH /api/keys/:id`.
- **Rotate** — `POST /api/keys/:id/rotate` issues a new key and revokes the old
  one, optionally after a **grace window** (`graceSeconds`); `0` = emergency
  rotation (immediate revoke).
- **Revoke / Delete** — soft revoke (`status: 'revoked'`); keys are never hard-deleted.
- **Status** — `active | disabled | revoked | expired` (expiry computed at read).
- **Scopes** — `projects:read/write`, `devices:read/write`, `billing:read/write`,
  `admin` (implies all), `future:ai`. `requireApiKey(...scopes)` resolves a key
  by hash (collection-group), checks status/expiry/grace, enforces scopes, and
  records `lastUsedAt`.

## Device lifecycle

`identity/fingerprint.ts` + `routes/devices.ts`:
- **Register** — stores hostname, platform, arch, CLI/Node version, and a
  **hashed fingerprint** built from multiple signals (identification only,
  never authentication). New trusted devices are bounded by the plan's device
  limit (Subscription Engine).
- **Rename / Trust / Untrust / Revoke / Delete / Re-register** — all via backend
  endpoints, audit-logged. Revoked devices set `isTrusted: false`.

## Session lifecycle

`identity/sessions.ts`:
- **Create** (`POST /api/sessions`) — exchanges verified auth for an
  access + refresh pair; records a `login` event.
- **List** (`GET /api/sessions`) — live sessions (not revoked, within idle +
  absolute timeouts); marks the current one via `x-session-id`.
- **Logout** (`POST /api/sessions/logout`) — revoke one session.
- **Logout all** (`POST /api/sessions/logout-all`) — revoke all (optionally
  except the current).
- **Timeouts** — idle (14d) and absolute (30d).

## Refresh token flow

`identity/token-utils.ts` + `sessions.ts`:
- Access token: short-lived (15m) HS256-signed (`uid`, `sid`, `exp`).
- Refresh token: opaque `drf_<tokenId>.<secret>`; only its SHA-256 hash is
  stored in `refreshTokens/{tokenId}`.
- **Rotation** — every `POST /api/sessions/refresh` issues a new pair and marks
  the old token used.
- **Reuse detection** — presenting an already-used refresh token revokes the
  **entire session** (compromise response) and is logged as `token_revoked`.
- **Expiry / revocation** — refresh fails closed if the session is revoked or
  past its idle/absolute timeout.

## Silent CLI refresh flow

The CLI verifies premium access on every command via `/api/cli/verify`
(periodic; Phase 12) with a bounded offline-grace cache. The Derivo session
endpoints provide the rotation primitives for a fully silent refresh: a client
holding a refresh token calls `/api/sessions/refresh` to obtain a new access
token without re-login. New CLI commands: `derivo auth status|sessions|logout-all`
and `derivo device list|rename|revoke`.

## Dashboard session management

Read-only hooks (`useSessions`, `useLoginHistory`) consume backend-written
collections (`users/{uid}/sessions`, `users/{uid}/loginHistory`). All
mutations (revoke, rotate, trust) go through backend APIs — the dashboard never
mutates identity state directly. Firestore rules make these collections
owner-read, backend-write only.

## API endpoints

```
GET    /api/sessions            POST /api/sessions            POST /api/sessions/logout
POST   /api/sessions/logout-all POST /api/sessions/refresh
GET    /api/devices             PATCH /api/devices/:id        DELETE /api/devices/:id
POST   /api/devices/:id/trust   POST /api/devices/:id/untrust POST /api/devices/:id/revoke
GET    /api/keys                POST /api/keys                PATCH /api/keys/:id
POST   /api/keys/:id/rotate     POST /api/keys/:id/revoke     DELETE /api/keys/:id
GET    /api/login-history
```

## Security

- API keys never stored in plaintext; constant-time hash compare; one-time display.
- Refresh token rotation + reuse detection (compromise → session revoked).
- Sessions revocable individually or all-at-once; idle + absolute timeouts.
- Device limits enforced via the Subscription Engine; ownership implicit (per uid).
- Cross-user access impossible (data scoped under the verified uid; foreign IDs → 404).
- Audit logging for key/device/session events; secrets/tokens/JWTs never logged.
- Firestore rules: `sessions`, `loginHistory`, `apiKeys`, `refreshTokens` are
  backend-write only.

## Remaining risks / known limitations

- **Firebase ID token refresh** — the CLI authenticates to the backend with a
  Firebase ID token (≈1h). The Derivo refresh system is implemented and tested,
  but full CLI cutover (capturing the Firebase refresh token at login and
  storing the Derivo pair) is the next integration step; until then a stale
  Firebase token requires `derivo login`.
- **Refresh store** — uses an in-memory map in mock/dev; Firestore in production
  (single-region). For multi-region, ensure consistent reads.
- **Concurrent rotation** — last-writer-wins on the refresh record; a true race
  on the same token is mitigated by reuse detection (the loser's token becomes
  "used" and any later reuse revokes the session).
- **API-key auth** requires a Firestore collection-group index on `hash`
  (auto-created on first query).

## Recommendations before production

1. Set `SESSION_SECRET` (and rotate periodically).
2. Capture the Firebase refresh token at CLI login and adopt Derivo session
   tokens for silent refresh.
3. Deploy the updated Firestore rules.
4. Add a scheduled cleanup for expired sessions/refresh tokens.
5. Move rate limiting + refresh store to Redis for multi-instance.
