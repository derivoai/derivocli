# Derivo Billing, Licensing & Subscription Architecture (Phase 5)

**Status:** Approved  
**Author:** Stripe Solutions Architect, Senior SaaS Engineer, Staff Product Engineer  
**Scope:** Stripe Integration, Feature Gating, CLI Licensing, and Trial Management

This document defines the production-grade billing platform for Derivo. It uses Stripe as the absolute source of truth for financial and subscription states, while the Derivo backend maps these states to robust Feature Entitlements and offline-capable CLI Licenses.

---

## 1. Billing Architecture

The Derivo billing architecture separates **Subscriptions** (financial state) from **Entitlements** (access rights). 

- **Payment Processor:** Stripe (Checkout, Customer Portal, Billing).
- **Source of Truth:** Stripe maintains the subscription state (`active`, `past_due`, `canceled`).
- **Internal Mapping:** Derivo's DB stores a synchronized replica of the subscription state to ensure sub-millisecond latency on API requests.
- **Trial Management:** Governed internally by Derivo (via the `trials` table created in Phase 2). Once a 7-day trial expires, the entitlement engine automatically falls back to the `community` tier if no active Stripe subscription exists.

---

## 2. Stripe Integration Strategy

- **Checkout:** Users are redirected to Stripe Checkout via a backend-generated `checkout_session`. Prices are NEVER hardcoded in the frontend; they are mapped to Stripe Price IDs stored in environment variables.
- **Customer Portal:** Upgrades, downgrades, cancellations, and invoice downloads are handled entirely by the Stripe Customer Portal. Derivo does not render custom billing forms.
- **Customer Mapping:** Upon registration or first checkout, a Stripe `Customer` is created. Their `cus_xxx` ID is stored on the Derivo `User` (or future `Team`) record.

---

## 3. License Architecture & CLI Flow

To support offline execution, the CLI cannot ping the API on every command. We use a **Cryptographically Signed License Token** architecture.

1. **Authentication:** `$ derivo login`
2. **Retrieval:** The CLI receives an Access Token (for API calls) AND a `License Token` (a signed JWT payload containing feature flags and an expiration date).
3. **Storage:** The License Token is stored securely in the OS Keyring.
4. **Validation:** The CLI verifies the JWT signature locally using Derivo's embedded Public Key.
5. **Offline Window:** The License Token is valid for 30 days. The CLI functions entirely offline during this window.
6. **Renewal:** The CLI background-syncs to refresh the License Token when an internet connection is available.

*Community users receive a perpetual, limited-feature License Token. Premium features validate against the signed flags in the token.*

---

## 4. Feature Flag Engine (Entitlements)

We strictly avoid anti-patterns like `if (user.plan === 'pro')`. Instead, we use an Entitlement Engine that derives flags from the user's current subscription/trial state.

```typescript
// Entitlement checks
export interface DerivoEntitlements {
  canUseCloudSync: boolean;
  canCreateTeam: boolean;
  canUsePluginMarketplace: boolean;
  canGenerateAPIKeys: boolean;
  maxDevices: number;
}

// The service resolves the plan/trial into specific flags
const entitlements = await EntitlementService.getForUser(userId);
if (!entitlements.canUseCloudSync) {
  throw new ForbiddenError("Cloud sync requires a Pro subscription.");
}
```

---

## 5. Database Schema (Drizzle ORM Strategy)

```typescript
// Synchronized from Stripe
export const subscriptions = pgTable("subscription", {
  id: text("id").primaryKey(), // e.g., sub_123
  userId: text("userId").references(() => users.id),
  stripeCustomerId: text("stripeCustomerId").notNull(),
  status: text("status").notNull(), // active, past_due, canceled, incomplete
  priceId: text("priceId").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});

// Logs all incoming webhooks for idempotency and auditing
export const billingEvents = pgTable("billing_event", {
  id: text("id").primaryKey(), // Stripe Event ID (evt_123)
  type: text("type").notNull(),
  status: text("status").default("pending"), // pending, processed, failed
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow()
});

// For custom enterprise overrides or beta flags
export const featureFlags = pgTable("feature_flag", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id),
  flagKey: text("flagKey").notNull(), // e.g., "beta_ai_engine"
  flagValue: boolean("flagValue").default(true),
});
```

---

## 6. API Inventory

All routes are mounted under `/api/v1/billing`.

- **Client Facing:**
  - `GET /billing` - Aggregates current plan, trial status, and feature limits.
  - `POST /billing/checkout` - Creates a Stripe Checkout session.
  - `POST /billing/portal` - Creates a Stripe Customer Portal session.
  - `GET /billing/features` - Returns resolved `DerivoEntitlements` for the UI.
  - `GET /billing/license` - Generates the offline License Token (JWT) for the CLI.

- **Stripe Facing:**
  - `POST /billing/webhook` - Stripe webhook receiver.

---

## 7. Webhook Architecture

Webhooks are critical for data consistency. 

1. **Signature Verification:** The raw body is verified against `STRIPE_WEBHOOK_SECRET`.
2. **Idempotency:** The event ID (`evt_xxx`) is inserted into the `billingEvents` table. If it already exists and is `processed`, the webhook returns 200 OK immediately (no-op).
3. **Queueing:** Complex events (e.g., provisioning Enterprise features) can be handed off to BullMQ, but simple subscription syncs are processed synchronously to ensure immediate dashboard updates.
4. **Events Handled:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

---

## 8. Billing Dashboard Integration

The dashboard UI (created in Phase 3) will hydrate its views using the `GET /billing` endpoint.

- **Trial State:** If the user is on the Community plan but has `trialDaysLeft > 0`, the UI displays the Trial Banner.
- **Downgrade Grace:** If a user cancels via the Customer Portal, `cancelAtPeriodEnd` becomes `true`. The UI shows "Cancels on [Date]".
- **Gating:** UI buttons for Pro features (e.g., "Enable Cloud Sync") will check the `GET /billing/features` response. If false, clicking the button triggers an Upgrade Modal pointing to `POST /billing/checkout`.

---

## 9. Folder Structure

Adhering to Vertical Slicing:

```text
apps/api/src/modules/billing/
├── billing.routes.ts          # Defines endpoints
├── billing.controller.ts      # HTTP layer (Checkout, Portal, Webhook)
├── billing.service.ts         # Stripe SDK interactions
├── entitlements.service.ts    # Resolves plans + trials into Feature Flags
├── license.service.ts         # Cryptographic generation of CLI tokens
├── billing.repository.ts      # DB interactions (Drizzle)
├── webhooks/
│   ├── webhook.handler.ts     # Routes specific Stripe events
│   └── webhook.validator.ts   # Stripe signature validation
├── billing.schema.ts          # Zod validation
└── billing.test.ts            # Unit and webhook mock tests
```

---

## 10. Environment Strategy

```typescript
export const billingEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().startsWith('price_'),
  STRIPE_PRO_YEARLY_PRICE_ID: z.string().startsWith('price_'),
  LICENSE_PRIVATE_KEY: z.string(), // Used to sign CLI licenses
});
```
Fails fast if these are missing. Prices are mapped via ENV, preventing hardcoded IDs in the database.

---

## 11. Security Checklist

- [x] Webhook signatures strictly validated using raw request bodies.
- [x] Webhook processing is strictly idempotent.
- [x] CLI License validation relies on asymmetric cryptography (RS256 or EdDSA). Only the backend has the private key; the CLI embeds the public key.
- [x] Billing APIs enforce strict RBAC (only the resource owner can request a checkout session).
- [x] Prices are never passed from the client; the client only requests a "tier" (e.g., `pro_monthly`), and the backend maps it to the ENV Price ID.

---

## 12. Testing Strategy

- **Webhook Mocks:** Unit tests simulate Stripe webhook payloads by constructing signed requests locally.
- **Feature Flag Matrix Tests:** `EntitlementsService` must have exhaustively parameterized unit tests:
  - `Given Community + No Trial -> Expect restricted flags`
  - `Given Community + Active Trial -> Expect Pro flags`
  - `Given Past Due Subscription -> Expect restricted flags`
- **Stripe Test Clock:** E2E tests use Stripe Test Clocks to simulate subscription lifecycles, expirations, and dunning processes.

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Webhook Delivery Failure | Run a nightly reconciliation cron job that queries Stripe for all active subscriptions and resyncs drift. |
| CLI License Forgery | Use EdDSA (Ed25519) for signing licenses. Ensure the public key is hardcoded in the CLI binary and obfuscated to deter trivial swapping. |
| Pricing Tier Changes | Storing `price_id` in ENVs ensures we can easily grandfather legacy users in the DB while offering new users updated price IDs. |

---

## 14. Self Review

- **Stripe Solutions Architect:** Excellent adherence to best practices. Delegating all plan management to the Stripe Customer Portal vastly reduces PCI compliance scope and frontend engineering overhead. Event idempotency via `billingEvents` is highly recommended.
- **Senior SaaS Engineer:** The `EntitlementsService` abstraction is perfect. When marketing decides to move a feature from "Pro" to "Community", we only change one mapping function, not 50 different `if (plan === 'pro')` checks across the codebase.
- **Security Engineer:** Emphasizing asymmetric encryption for the offline CLI license is the right move. The backend holds the private key, preventing any malicious actor from generating spoofed licenses locally.

**Conclusion:** The Billing, Licensing, and Subscription architecture is ready for implementation.
