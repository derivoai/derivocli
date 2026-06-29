/**
 * MockProvider — used in tests and local development. Webhook authenticity is a
 * simple shared-secret header so tests can exercise verification + replay.
 */
import type { BillingProvider, NormalizedBillingEvent } from '../types.js';
import { normalizePlanId } from '../plans.js';

export class MockProvider implements BillingProvider {
  readonly name = 'mock';

  constructor(private readonly secret = process.env.MOCK_WEBHOOK_SECRET || 'mock-secret') {}

  verifyWebhook(_rawBody: Buffer, headers: Record<string, unknown>): boolean {
    const sig = headers['x-mock-signature'];
    return typeof sig === 'string' && sig === this.secret;
  }

  parseWebhook(rawBody: Buffer, _headers: Record<string, unknown>): NormalizedBillingEvent {
    const payload = JSON.parse(rawBody.toString('utf8'));
    return {
      eventId: String(payload.eventId ?? payload.id ?? ''),
      type: payload.type,
      provider: this.name,
      uid: payload.uid,
      email: payload.email,
      planId: payload.planId ? normalizePlanId(payload.planId) : undefined,
      providerCustomerId: payload.customerId,
      providerSubscriptionId: payload.subscriptionId,
      currentPeriodEnd: payload.currentPeriodEnd ?? null,
      trialEndsAt: payload.trialEndsAt ?? null,
      raw: payload,
    };
  }
}
