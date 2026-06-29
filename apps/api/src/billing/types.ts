/**
 * Billing domain types — provider-agnostic. No vendor (Lemon Squeezy, Stripe,
 * Polar) appears here; providers normalize their payloads into these shapes.
 */
import type { PlanId } from './plans.js';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'cancelled' // cancelled but possibly still within paid period
  | 'grace' // payment failed, within grace window
  | 'expired'
  | 'none';

/** The persisted subscription record (Firestore `subscriptions/{uid}`). */
export interface SubscriptionRecord {
  uid: string;
  planId: PlanId;
  status: SubscriptionStatus;
  /** Which billing provider owns this subscription. */
  provider?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  /** ISO timestamps. */
  currentPeriodEnd?: string | null;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  cancelledAt?: string | null;
  gracePeriodEndsAt?: string | null;
  /** Admin-granted temporary access end (overrides). */
  temporaryAccessUntil?: string | null;
  /** Per-user limit overrides (admin). */
  limitOverrides?: Partial<Record<string, number>> | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Canonical event types every provider maps to. */
export type BillingEventType =
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.cancelled'
  | 'subscription.expired'
  | 'subscription.refunded'
  | 'payment.failed';

/** A provider-normalized billing event. */
export interface NormalizedBillingEvent {
  /** Stable provider event id — used to reject replays. */
  eventId: string;
  type: BillingEventType;
  provider: string;
  /** Resolve the Derivo user. Providers should pass custom data (uid). */
  uid?: string;
  email?: string;
  planId?: PlanId;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  /** ISO timestamp for the new period end, when applicable. */
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  /** Original payload kept for auditing/debugging (never returned to clients). */
  raw?: unknown;
}

/**
 * A billing provider adapter. Swap providers without touching business logic:
 *
 *   BillingProvider
 *     ├── LemonSqueezyProvider
 *     ├── StripeProvider   (future)
 *     ├── PolarProvider    (future)
 *     └── MockProvider     (tests)
 */
export interface BillingProvider {
  readonly name: string;
  /** Verify the webhook authenticity from the RAW request body + headers. */
  verifyWebhook(rawBody: Buffer, headers: Record<string, unknown>): boolean;
  /** Parse a verified webhook into a normalized event. */
  parseWebhook(rawBody: Buffer, headers: Record<string, unknown>): NormalizedBillingEvent;
}
