/**
 * License synchronization — the ONLY place billing events mutate a user's
 * subscription. Includes replay protection (idempotent by eventId) and audit
 * logging. Clients never write subscription state.
 */
import { getDb, isAdminInitialized } from '../firebase.js';
import { audit } from '../security/audit.js';
import { remember, seen, resetReplayStoreForTesting } from '../infra/replay.js';
import { syncEmailFingerprint } from '../security/account-abuse.js';
import type { NormalizedBillingEvent, SubscriptionRecord, SubscriptionStatus } from './types.js';
import type { PlanId } from './plans.js';

const GRACE_PERIOD_DAYS = 3;

export interface ApplyResult {
  applied: boolean;
  duplicate?: boolean;
  reason: string;
  status?: SubscriptionStatus;
}

async function isReplay(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  // Firestore is the source of truth for processed events when available; the
  // store (memory/Redis) provides distributed protection without Firebase.
  if (!isAdminInitialized()) return seen('billing', eventId);
  const ref = getDb().collection('billingEvents').doc(eventId);
  return (await ref.get()).exists;
}

async function markProcessed(event: NormalizedBillingEvent): Promise<void> {
  if (!event.eventId) return;
  if (!isAdminInitialized()) {
    await remember('billing', event.eventId);
    return;
  }
  await getDb()
    .collection('billingEvents')
    .doc(event.eventId)
    .set({
      type: event.type,
      provider: event.provider,
      uid: event.uid ?? null,
      processedAt: new Date().toISOString(),
    });
}

/** Translate a normalized event into subscription record changes. */
function recordChangesFor(
  event: NormalizedBillingEvent,
  nowIso: string,
): Partial<SubscriptionRecord> {
  const plan: PlanId = event.planId ?? 'pro';
  switch (event.type) {
    case 'subscription.created':
    case 'subscription.renewed':
      return {
        planId: plan,
        status: 'active',
        currentPeriodEnd: event.currentPeriodEnd ?? null,
        trialEndsAt: event.trialEndsAt ?? null,
        cancelledAt: null,
        gracePeriodEndsAt: null,
        updatedAt: nowIso,
      };
    case 'subscription.cancelled':
      return {
        status: 'cancelled',
        cancelledAt: nowIso,
        currentPeriodEnd: event.currentPeriodEnd ?? null,
        updatedAt: nowIso,
      };
    case 'subscription.expired':
      return { status: 'expired', planId: 'free', updatedAt: nowIso };
    case 'subscription.refunded':
      return { status: 'expired', planId: 'free', updatedAt: nowIso };
    case 'payment.failed':
      return {
        status: 'grace',
        gracePeriodEndsAt: new Date(Date.now() + GRACE_PERIOD_DAYS * 86_400_000).toISOString(),
        updatedAt: nowIso,
      };
    default:
      return { updatedAt: nowIso };
  }
}

/** Apply a verified, parsed billing event. Idempotent. */
export async function applyBillingEvent(event: NormalizedBillingEvent): Promise<ApplyResult> {
  if (!event.uid) {
    return { applied: false, reason: 'Event has no resolvable user (uid)' };
  }
  if (await isReplay(event.eventId)) {
    return { applied: false, duplicate: true, reason: 'Duplicate event (replay ignored)' };
  }

  const nowIso = new Date().toISOString();
  const changes = recordChangesFor(event, nowIso);

  if (isAdminInitialized()) {
    const db = getDb();
    const ref = db.collection('subscriptions').doc(event.uid);
    const existing = (await ref.get()).data() as SubscriptionRecord | undefined;
    await ref.set(
      {
        uid: event.uid,
        provider: event.provider,
        providerCustomerId: event.providerCustomerId ?? existing?.providerCustomerId ?? null,
        providerSubscriptionId:
          event.providerSubscriptionId ?? existing?.providerSubscriptionId ?? null,
        createdAt: existing?.createdAt ?? nowIso,
        ...changes,
      },
      { merge: true },
    );
    // Mirror the role for legacy reads.
    await db
      .collection('users')
      .doc(event.uid)
      .set(
        { role: changes.planId ?? existing?.planId ?? 'free', updatedAt: nowIso },
        { merge: true },
      );
  }

  await markProcessed(event);
  await audit('billing.event', event.uid, { type: event.type, provider: event.provider });

  // Keep the email fingerprint in sync so re-registrations always inherit the
  // most current trial/subscription state.
  const trialUsed =
    changes.status === 'active' ||
    changes.status === 'trialing' ||
    changes.status === 'cancelled' ||
    changes.status === 'expired';
  await syncEmailFingerprint(event.uid, {
    trialUsed,
    trialEndsAt: changes.trialEndsAt ?? null,
    status: changes.status ?? null,
    planId: changes.planId ?? null,
  }).catch(() => {
    /* best-effort */
  });

  return { applied: true, reason: 'Applied', status: changes.status };
}

/** Test helper to reset the replay guard (distributed store). */
export function resetProcessedEventsForTesting(): void {
  resetReplayStoreForTesting();
}
