# Derivo Billing Architecture (Phase 12)

All subscription, trial, quota, and billing decisions are made by the backend.
The frontend (Dashboard & CLI) only **displays** backend-computed results.

## Provider-agnostic design

Billing providers are pluggable; business logic never references a vendor:

```
BillingProvider (interface)
  ├── LemonSqueezyProvider   (HMAC-verified webhooks)
  ├── StripeProvider         (future)
  ├── PolarProvider          (future)
  └── MockProvider           (tests / local dev)
```

`getBillingProvider()` selects one via `BILLING_PROVIDER`, or auto-detects
Lemon Squeezy when `LEMONSQUEEZY_WEBHOOK_SECRET` is set. A provider implements
only `verifyWebhook(rawBody, headers)` and `parseWebhook(...) → NormalizedBillingEvent`.
Everything downstream (`applyBillingEvent`, subscription evaluation, gates)
operates on the normalized event — adding Stripe/Polar means writing one adapter,
no business-logic changes.

## Core engine

- **Plan catalog** (`billing/plans.ts`): Free / Trial / Pro / Enterprise with
  configurable limits (`projects`, `devices`, `apiKeys`, `plugins`, `ai`, `storage`,
  `premiumCommands`). `-1` = unlimited.
- **Subscription Service** (`billing/subscription-service.ts`):
  `evaluateSubscription(record)` (pure), `getSubscriptionState(uid)`,
  `canUse(uid, feature)`, `getLimit(uid, feature)`, and `looseDocToRecord()` to
  normalize legacy docs. Single source of truth — no duplicated logic.
- **Usage Service** (`billing/usage-service.ts`): counts real usage and builds
  the dashboard usage report (used / limit / remaining).
- **Feature Gate** (`billing/feature-gate.ts`): `requireFeature('projects')`
  middleware. Routes never write `if (plan === 'pro')`.
- **License Sync** (`billing/license-sync.ts`): the only writer of subscription
  state from billing events; idempotent (replay-safe by `eventId`).
- **Admin** (`billing/admin.ts`): grant plan, extend trial, revoke, adjust
  limits, temporary access — all audit-logged.

## Subscription flow

1. Provider webhook → `/api/billing/webhook`.
2. `provider.verifyWebhook(rawBody, headers)` (signature) → reject on failure (401).
3. `provider.parseWebhook` → `NormalizedBillingEvent`.
4. `applyBillingEvent` → replay check → update `subscriptions/{uid}` → audit.
5. `getSubscriptionState(uid)` evaluates the record on demand:
   - `active`/`trialing` within period → active
   - `cancelled` within paid period → active until period end, then expired
   - `grace` within grace window → active, then expired
   - `expired`/`refunded` → not active
   - admin `temporaryAccessUntil` overrides while valid

## Trial flow

`status: 'trialing'` + `trialEndsAt`. The engine computes `remainingDays` /
`remainingHours` and flips to expired once `trialEndsAt` passes. Legacy trials
stored as `status:'active'` are normalized to `trialing` by `looseDocToRecord`
so they expire correctly. Trial activation (phone-verified) writes state only
server-side (`/api/trials/verify-phone`), with phone-hash uniqueness preventing
resets/abuse.

## Webhook flow & security

- Authenticity from the provider signature over the **raw body** (captured via
  `express.json({ verify })`).
- **Replay protection**: each `eventId` is processed once (`billingEvents/{id}`
  in Firestore; in-memory set in dev/tests).
- Clients can never POST billing events that mutate state — only signed
  provider webhooks are honored.

## CLI verification flow

- Premium commands call `/api/cli/verify` **every run** (periodic; no permanent
  cache).
- On success the result is cached briefly; if the backend is unreachable, an
  **offline grace window (72h)** allows continued use, then fails closed.
- Inactive / 401 clears the cache and denies. Free/offline commands never call
  this and always work.

## Dashboard flow

The dashboard reads backend-computed values:
- `GET /api/subscription` — plan, status, trial remaining, renewal date.
- `GET /api/usage` — used / limit / remaining per feature.
- `GET /api/limits` — plan limits.
- `GET /api/features` — per-feature `canUse` decisions.

It must not compute plan/trial/limits locally.

## API endpoints (all protected unless noted)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/subscription` | Subscription state (display) |
| GET | `/api/usage` | Usage report |
| GET | `/api/limits` | Plan limits |
| GET | `/api/features` | Feature availability |
| GET | `/api/cli/verify` | CLI premium gate |
| POST | `/api/billing/webhook` | Provider webhook (signature-verified, public) |
| POST | `/api/admin/*` | Admin overrides (role-gated, audited) |

## Security guarantees

- Premium cannot be enabled from DevTools — entitlements are server-computed and
  subscription writes are backend/Admin-only (Firestore rules deny client writes).
- Expired subscriptions/trials lose access immediately (evaluated on each request).
- Webhook signatures are verified; replays are rejected.
- Feature gates + plan limits enforced server-side.
- Admin overrides and billing events are audit-logged.

## Future Lemon Squeezy integration points

1. Set `LEMONSQUEEZY_WEBHOOK_SECRET` (and `BILLING_PROVIDER=lemonsqueezy`).
2. In LS, point the webhook at `POST /api/billing/webhook` and subscribe to
   subscription + payment events.
3. Pass the Derivo `uid` in checkout `custom_data` so events resolve to a user.
4. Map LS product/variant → `PlanId` in `LemonSqueezyProvider.parseWebhook`
   (defaults to `pro`).
5. Optionally add a `createCheckout()` method to the provider for hosted checkout.

## Adding another provider (Stripe/Polar) without changing business logic

Implement `BillingProvider` (verify + parse → `NormalizedBillingEvent`), register
it in `providers/index.ts`, and set `BILLING_PROVIDER`. `applyBillingEvent`,
plans, gates, and the dashboard remain unchanged.

## Known limitations

- Replay store is per-instance in dev; production uses Firestore `billingEvents`.
- Trial/period expiry is evaluated on read; add a scheduled job to also flip
  stored `status` for accurate at-rest reporting.
- The CLI still writes some collections directly (constrained by Firestore
  rules); plan **limits** are enforced via backend routes, so direct CLI writes
  bypass numeric limits (gated only by active-subscription rules).
- Rate limiting is in-memory (use Redis for multi-instance).
