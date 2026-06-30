# Infrastructure & Production Readiness (Phase 14)

This document describes the production infrastructure underneath the Derivo
backend (`apps/api`): configuration, the pluggable store, distributed rate
limiting and replay protection, background jobs, observability, resilience,
backups, and operational security. None of it changes the existing
architecture, billing, dashboard, or CLI — it hardens what is already there.

---

## Configuration (`src/infra/config.ts`)

All runtime configuration is centralized in `loadConfig()` and validated with
`validateConfig()`. Validation **warns** in development and **fails fast** in
production (the process refuses to start on critical problems).

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `3001` | HTTP port |
| `APP_URL` | `http://localhost:3000` | Allowed CORS origin |
| `STORE_BACKEND` | auto | `memory` \| `firestore` \| `redis` |
| `REDIS_URL` | — | If set, the store prefers Redis |
| `SESSION_SECRET` | dev placeholder | Required in production |
| `BILLING_PROVIDER` | — | e.g. `lemonsqueezy` |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | — | Required when using lemonsqueezy |
| `AUDIT_RETENTION_DAYS` | `90` | Audit-log retention window |
| `JOBS_ENABLED` | prod=on | Run background jobs in this process |
| `DERIVO_REQUIRE_FIREBASE` | prod=on | Refuse to start in mock mode |
| `FEATURE_DISTRIBUTED_RATE_LIMIT` | auto | Feature flag |
| `FEATURE_BACKGROUND_JOBS` | prod=on | Feature flag |
| `FEATURE_TELEMETRY` | off | Feature flag |

**Store auto-selection:** Redis if `REDIS_URL` is set, otherwise Firestore in
production, otherwise memory.

---

## Pluggable store (`src/infra/store.ts`)

A single `KVStore` interface with three interchangeable backends:

- **memory** — development/tests (per-process, not shared).
- **firestore** — default in production without Redis; uses a `kv` collection,
  transactions for atomic `incr`.
- **redis** — preferred for multi-instance deployments; lazily loads `ioredis`
  **only if installed**, so the dependency is optional today.

If `REDIS_URL` is configured but `ioredis` is unavailable, the store logs a
warning and falls back (Firestore when Firebase is initialized, otherwise
memory). This makes the Redis upgrade a config-only change later.

> **To enable Redis:** `pnpm --filter @derivo/api add ioredis`, set `REDIS_URL`,
> and (optionally) `STORE_BACKEND=redis`. No code changes required.

---

## Distributed rate limiting (`src/security/rate-limit.ts`)

A sliding-window-counter algorithm backed by the store, so limits stay
consistent across multiple API instances. Key helpers support per-IP,
per-user, per-device, and per-API-key limits (`byIp`, `byUser`, `byDevice`,
`byApiKey`). Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset`, and `Retry-After` on 429.

**Fails open:** a store outage allows the request and records a `store.errors`
metric, so rate limiting degrades gracefully instead of taking the API down.

---

## Distributed replay protection (`src/infra/replay.ts`)

`seen`, `remember`, and `checkAndRemember` persist processed ids in the store
with a TTL (default 30 days), giving cross-instance protection. Billing webhook
processing (`src/billing/license-sync.ts`) uses Firestore `billingEvents` as
the source of truth when Firebase is available, and the store otherwise; the
downstream apply is idempotent either way.

---

## Background jobs (`src/infra/jobs.ts`)

Scheduled maintenance workers, gated by `jobsEnabled` / `features.backgroundJobs`:

| Job | Interval | Action |
| --- | --- | --- |
| `trial-expiration` | 1h | Expire trials past `trialEndsAt` |
| `temp-access-expiration` | 1h | Expire grace windows past `gracePeriodEndsAt` |
| `session-cleanup` | 6h | Delete revoked / expired sessions |
| `device-cleanup` | 24h | Prune long-stale revoked devices |
| `refresh-token-cleanup` | 6h | Delete used / expired refresh tokens |
| `expired-api-key-cleanup` | 6h | Delete expired API keys |
| `audit-retention` | 24h | Delete audit logs older than retention |

Jobs are no-ops (`skipped`) without Firebase. In multi-instance deployments,
enable jobs on a **single** worker (or a dedicated cron) to avoid duplicate
runs. Failures are captured and counted (`jobs.failures`), never propagated.

---

## Observability

- **Liveness** `GET /healthz` — process is up.
- **Readiness** `GET /readyz` — probes the store and Firebase mode; returns 503
  when a dependency is unusable (or Firebase is required but missing).
- **Health** `GET /health` — simple ok + timestamp (rate-limited).
- **Metrics** `GET /metrics` — counters + latency (count/avg/max/p95), uptime,
  memory.
- **Structured logging** (`src/infra/logger.ts`) — JSON in production, with
  secret sanitization (authorization, token, secret, password, api-key, cookie,
  refresh are redacted).
- **Request/correlation IDs** (`src/infra/request-context.ts`) — every response
  carries `X-Request-Id` and `X-Correlation-Id`; an inbound correlation id is
  propagated.

### Monitored counters (`src/infra/metrics.ts`)

`http.requests`, `http.errors`, `auth.failures`, `ratelimit.hits`,
`billing.webhook.failures`, `plugin.failures`, `cli.verify.failures`,
`session.refresh.failures`, `jobs.runs`, `jobs.failures`, `store.errors`.

---

## Resilience (`src/infra/resilience.ts`)

- `withRetry` — bounded retries with exponential backoff + jitter and an
  optional `shouldRetry` predicate.
- `withTimeout` — rejects an operation that overruns a deadline.
- `CircuitBreaker` — opens after N consecutive failures, rejects fast while
  open, allows a half-open trial after a cooldown.
- **Graceful shutdown** (`src/index.ts`) — on `SIGTERM`/`SIGINT` the server
  stops accepting connections, stops jobs, drains in-flight requests, and exits
  (10s hard cap).

---

## Backups & recovery

Firestore is the system of record. Recommended operational practice:

1. **Scheduled export** — enable Firestore managed daily exports to a Cloud
   Storage bucket:
   ```sh
   gcloud firestore export gs://<bucket>/backups/$(date +%F) \
     --collection-ids=users,subscriptions,trials,refreshTokens,billingEvents,kv
   ```
2. **Retention** — apply a bucket lifecycle policy (e.g. keep 30 daily / 12
   monthly exports).
3. **Configuration backup** — keep `.env` values in a secrets manager; never
   commit secrets. The committed `.env.example` documents required keys.
4. **Recovery** — restore with `gcloud firestore import gs://<bucket>/backups/<date>`.
   Validate by booting one instance against the restored project and hitting
   `/readyz`.

---

## Performance

- Sliding-window counters use small per-key entries with TTLs (constant memory
  per window, automatic expiry).
- Rate limiting and replay reads/writes are O(1) per request.
- Redis is the recommended store at scale (sub-ms ops, native TTL/`INCR`);
  Firestore is the zero-extra-infrastructure default and uses transactions only
  for atomic increments.
- Background cleanup keeps hot collections (sessions, refresh tokens, audit
  logs) bounded, which keeps query latency stable.

---

## Security

- Production refuses to boot in mock mode or with a default `SESSION_SECRET`,
  `memory` store, or a billing provider missing its webhook secret.
- Logs and audit metadata are sanitized; known-sensitive keys are redacted.
- Webhook reliability: signature verification over the exact raw body plus
  idempotent, distributed replay protection.
- **Redis security:** use TLS (`rediss://`), an auth password/ACL, a private
  network, and never expose the instance publicly.

---

## Known limitations

- Metrics are in-process; for multi-instance aggregation, ship them to an
  external backend (the counters/labels are already structured for it).
- Sessions persist in Firestore (distributed) or memory (dev); a dedicated
  Redis session backend is not yet implemented (not required for correctness).
- Background-job queries scan the relevant collections and filter in-process;
  for very large datasets, move to indexed range queries or a managed scheduler.
- `checkAndRemember` is check-then-set (not a single atomic op) across backends;
  acceptable because downstream applies are idempotent.
