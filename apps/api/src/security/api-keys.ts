/**
 * API key security.
 *
 * Keys are cryptographically random, shown ONCE at creation, and only their
 * SHA-256 hash is stored. We keep a prefix + last-4 for display, never the
 * plaintext. Verification hashes the presented key and constant-time compares.
 */
import crypto from 'crypto';

export const API_KEY_PREFIX_LIVE = 'drv_live_';
export const API_KEY_PREFIX_TEST = 'drv_test_';

export interface GeneratedApiKey {
  /** Full plaintext key — return to the client ONCE, never persist. */
  plaintext: string;
  /** Stored: SHA-256 hex of the plaintext. */
  hash: string;
  /** Stored display prefix (e.g. "drv_live_"). */
  prefix: string;
  /** Stored display tail, e.g. last 4 chars. */
  last4: string;
}

export function hashApiKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

export function generateApiKey(live = true): GeneratedApiKey {
  const prefix = live ? API_KEY_PREFIX_LIVE : API_KEY_PREFIX_TEST;
  // 32 random bytes -> 43-char base64url secret.
  const secret = crypto.randomBytes(32).toString('base64url');
  const plaintext = `${prefix}${secret}`;
  return {
    plaintext,
    hash: hashApiKey(plaintext),
    prefix,
    last4: plaintext.slice(-4),
  };
}

/** Constant-time comparison of a presented key against a stored hash. */
export function verifyApiKey(plaintext: string, storedHash: string): boolean {
  const presented = Buffer.from(hashApiKey(plaintext), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  if (presented.length !== stored.length) return false;
  return crypto.timingSafeEqual(presented, stored);
}

/** Masked preview for listing, e.g. "drv_live_••••••••1a2b". */
export function maskedPreview(prefix: string, last4: string): string {
  return `${prefix}${'•'.repeat(8)}${last4}`;
}
