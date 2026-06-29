/**
 * Provider factory — selects the active billing provider without coupling
 * business logic to any vendor. Override with BILLING_PROVIDER.
 */
import type { BillingProvider } from '../types.js';
import { LemonSqueezyProvider } from './lemonsqueezy.js';
import { MockProvider } from './mock.js';

export { LemonSqueezyProvider, MockProvider };

let override: BillingProvider | null = null;

/** Inject a provider (used by tests). */
export function setBillingProviderForTesting(provider: BillingProvider | null): void {
  override = provider;
}

export function getBillingProvider(): BillingProvider {
  if (override) return override;

  const explicit = (process.env.BILLING_PROVIDER || '').toLowerCase();
  if (explicit === 'lemonsqueezy') return new LemonSqueezyProvider();
  if (explicit === 'mock') return new MockProvider();

  // Auto: use Lemon Squeezy when a signing secret is configured, else mock.
  if (process.env.LEMONSQUEEZY_WEBHOOK_SECRET) return new LemonSqueezyProvider();
  return new MockProvider();
}
