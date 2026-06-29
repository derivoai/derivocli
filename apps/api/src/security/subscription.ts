/**
 * Backward-compatible subscription adapter (Phase 11 shape).
 *
 * The authoritative engine is `billing/subscription-service`. This module
 * preserves the Phase 11 `SubscriptionResult` names/shape and delegates ALL
 * logic to the engine (no duplicated subscription logic).
 */
import {
  evaluateSubscription,
  getSubscriptionState,
  looseDocToRecord,
  type SubscriptionState,
} from '../billing/subscription-service.js';

export interface SubscriptionResult {
  active: boolean;
  plan: string;
  status: string;
  endsAt: number | null;
  remainingDays: number;
  isTrial: boolean;
  reason: string;
}

function toResult(state: SubscriptionState): SubscriptionResult {
  return {
    active: state.active,
    plan: state.planId,
    status: state.status,
    endsAt: state.endsAt ? Date.parse(state.endsAt) : null,
    remainingDays: state.remainingDays,
    isTrial: state.isTrial,
    reason: state.reason,
  };
}

/** Pure: evaluate a raw subscription document. */
export function computeSubscription(sub: Record<string, unknown> | null): SubscriptionResult {
  return toResult(evaluateSubscription(looseDocToRecord('legacy', sub)));
}

/** Load + evaluate a user's subscription from Firestore. */
export async function getSubscription(uid: string): Promise<SubscriptionResult> {
  return toResult(await getSubscriptionState(uid));
}
