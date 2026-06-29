# Derivo Backend Security Report (Phase 11)

## 1. Trust boundary

The client (Dashboard & CLI) is **untrusted**. Every security-sensitive decision
is made server-side:

```
Dashboard / CLI
  → Firebase Authentication
  → Firebase ID Token
  → Backend API (apps/api)
      → Token verification (verifyIdToken, checkRevoked)
      → Authorization (ownership / role)
      → Subscription + trial check
      → Input validation
      → Audit log
  → Firestore (via Admin SDK)
Firestore Security Rules = second layer (defense in depth)
```

Clients never decide premium access, trial state, ownership, roles, or limits.

## 2. Authentication flow

`security/auth.ts → requireAuth`:
- Requires `Authorization: Bearer <Firebase ID token>`.
- `verifyIdToken(token, /* checkRevoked */ true)` rejects expired, invalid-signature, and **revoked** tokens, and disabled users.
- The UID comes only from the decoded token — never from the body/query.
- Missing/invalid → `401 { code: "unauthorized" }`.
- Mock mode (no Firebase creds) is **dev-only**; the server refuses to start in mock mode when `DERIVO_REQUIRE_FIREBASE=1` or `NODE_ENV=production`.

## 3. Authorization flow

`security/authorize.ts`:
- `requireActiveSubscription` — gates premium routes; verdict from `getSubscription(uid)`.
- `requireProjectOwnership` — loads the project, checks `ownerUid === uid`, existence, and soft-delete/archive. Foreign/missing/deleted all return **404** to prevent ID enumeration.
- `requireRole(...)` — future-ready role gate (owner/admin/member/readonly).

## 4. Subscription & trial enforcement

`security/subscription.ts` is the single source of truth. It reads
`subscriptions/{uid}` (fallback `users/{uid}`) with the Admin SDK and computes
`active`, `plan`, `status`, `isTrial`, `remainingDays`, `endsAt`. Robust date
parsing handles ISO strings, epoch seconds/ms, and Firestore Timestamps. The
CLI gate (`/api/cli/verify`) and the dashboard display (`/api/subscription`)
both consume this — neither computes access itself.

## 5. API key security

`security/api-keys.ts` + `routes/keys.ts`:
- 32 bytes of CSPRNG randomness, prefixed (`drv_live_`).
- Only the **SHA-256 hash** is stored; plaintext is shown **once** at creation.
- Listing exposes a masked preview (`prefix + •••• + last4`), never the hash to the wire as a key.
- Revocation (soft), rotation (revoke + reissue), `last-used` field, per-user limit (50).
- Verification uses `crypto.timingSafeEqual`.

## 6. Firestore Rules audit (`firestore.rules`)

| Collection | Client read | Client write |
| --- | --- | --- |
| `subscriptions/{uid}` | owner only | **denied** (backend/Admin only) |
| `trials/{id}` | denied | **denied** |
| `users/{uid}` | owner | owner, but `role`/`subscription` fields are immutable |
| `users/{uid}/devices` | owner | owner |
| `users/{uid}/projects` | owner | owner **and active subscription** |
| `users/{uid}/apiKeys` | owner (metadata) | **denied** (backend only) |
| `users/{uid}/auditLogs` | owner | **denied** (backend only) |
| everything else | denied | denied (recursive default-deny) |

The previously over-permissive catch-all (`/{collection}/{docId}` owner-write)
was removed, closing client writes to `apiKeys`/`auditLogs`/unknown subcollections.

## 7. Hardening summary

- **Rate limiting** (`security/rate-limit.ts`): auth, CLI login, project/key/device creation, public health.
- **Security headers** (`security/headers.ts`): CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; `X-Powered-By` removed.
- **Input validation** (`security/validation.ts`): strict zod schemas (unknown fields rejected, enum/ID validation); JSON body capped at 100 kB; malformed JSON → 400.
- **Audit logging** (`security/audit.ts`): auth/project/key/device/billing events to `users/{uid}/auditLogs`; sensitive keys (token/password/secret/apiKey) redacted; secrets never logged.
- **Error handling** (`security/errors.ts`): stable `{ error, code }` shape; no stack traces, paths, queries, or secrets leaked.

## 8. OWASP Top 10 review

- **A01 Broken Access Control** — ownership + subscription enforced server-side; enumeration-safe 404s; default-deny rules. ✅
- **A02 Cryptographic Failures** — API keys hashed (SHA-256), never stored in plaintext; session token machine-bound (CLI). ✅
- **A03 Injection** — no SQL; Firestore via Admin SDK with validated, typed inputs; strict schemas. ✅
- **A04 Insecure Design** — trust boundary moved to backend; rules as second layer. ✅
- **A05 Security Misconfiguration** — security headers; mock-mode startup guard for production; CORS allowlist. ✅
- **A07 Auth Failures** — token verification with revocation check; rate-limited auth. ✅
- **A09 Logging Failures** — audit logging with secret redaction. ✅

## 9. Known risks / limitations

- **Rate limiting is in-memory** — correct for a single instance; use Redis for multi-instance production.
- **CLI still writes some collections directly** (projects/devices) via the user token. This is constrained by the Firestore rules (owner + active subscription), but the recommended path is the backend routes (`/api/projects`, `/api/devices`) — a future CLI migration.
- **Dashboard reads Firestore directly** (allowed, owner-scoped). API key metadata reads include the stored hash; migrate the dashboard to `/api/keys` to avoid exposing it.
- **CLI token refresh** — ID tokens expire after ~1h; the CLI does not yet refresh them (re-login required). Recommend storing the refresh token.
- **Trial expiry** — rules check `status == 'active'`; a cron/Cloud Function should flip expired trials to `expired` (the backend verify already computes expiry by date).

## 10. Recommendations before beta

1. Deploy the Firestore rules: `firebase deploy --only firestore:rules`.
2. Set `DERIVO_REQUIRE_FIREBASE=1` on the hosted backend so it never runs open.
3. Put the API behind HTTPS (HSTS is already sent).
4. Add CLI token refresh to avoid mid-session 401s.
5. Migrate dashboard API-key reads to `/api/keys`.
6. Add a scheduled job to expire trials in Firestore.
