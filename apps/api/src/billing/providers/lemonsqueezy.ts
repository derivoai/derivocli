/**
 * LemonSqueezyProvider — verifies LS webhooks (HMAC-SHA256 over the raw body
 * using the signing secret) and normalizes LS events to our domain events.
 *
 * Configure: LEMONSQUEEZY_WEBHOOK_SECRET. The Derivo uid must be passed in the
 * checkout `custom_data` ({ uid }) so events resolve to a user.
 */
import crypto from 'crypto';
import type { BillingProvider, BillingEventType, NormalizedBillingEvent } from '../types.js';
import { normalizePlanId, type PlanId } from '../plans.js';

const EVENT_MAP: Record<string, BillingEventType> = {
  subscription_created: 'subscription.created',
  subscription_resumed: 'subscription.renewed',
  subscription_unpaused: 'subscription.renewed',
  subscription_payment_success: 'subscription.renewed',
  subscription_cancelled: 'subscription.cancelled',
  subscription_expired: 'subscription.expired',
  subscription_paused: 'subscription.expired',
  subscription_payment_failed: 'payment.failed',
  order_refunded: 'subscription.refunded',
};

export class LemonSqueezyProvider implements BillingProvider {
  readonly name = 'lemonsqueezy';

  constructor(private readonly secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '') {}

  verifyWebhook(rawBody: Buffer, headers: Record<string, unknown>): boolean {
    if (!this.secret) return false; // never accept unsigned in real mode
    const provided = String(headers['x-signature'] ?? '');
    if (!provided) return false;
    const expected = crypto.createHmac('sha256', this.secret).update(rawBody).digest('hex');
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }

  parseWebhook(rawBody: Buffer, _headers: Record<string, unknown>): NormalizedBillingEvent {
    const payload = JSON.parse(rawBody.toString('utf8'));
    const meta = payload.meta ?? {};
    const data = payload.data ?? {};
    const attrs = data.attributes ?? {};
    const eventName = String(meta.event_name ?? '');
    const type = EVENT_MAP[eventName] ?? 'subscription.expired';

    // The product/variant determines the plan; default to pro for a paid sub.
    let planId: PlanId | undefined;
    if (attrs.variant_name) planId = normalizePlanId(attrs.variant_name);
    if (!planId && (type === 'subscription.created' || type === 'subscription.renewed')) {
      planId = 'pro';
    }

    return {
      eventId: String(
        payload.meta?.webhook_id ?? data.id ?? `${eventName}:${attrs.updated_at ?? ''}`,
      ),
      type,
      provider: this.name,
      uid: meta.custom_data?.uid,
      email: attrs.user_email,
      planId,
      providerCustomerId: attrs.customer_id ? String(attrs.customer_id) : undefined,
      providerSubscriptionId: data.id ? String(data.id) : undefined,
      currentPeriodEnd: attrs.renews_at ?? attrs.ends_at ?? null,
      trialEndsAt: attrs.trial_ends_at ?? null,
      raw: payload,
    };
  }
}
