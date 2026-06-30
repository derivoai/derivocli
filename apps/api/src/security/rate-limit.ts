/**
 * Distributed rate limiting via the pluggable store (memory / Firestore /
 * Redis). Uses a sliding-window-counter algorithm that is portable across all
 * backends and consistent across multiple API instances.
 *
 * Fails OPEN on store errors (allows the request, records a metric) so a store
 * outage degrades gracefully instead of taking the API down.
 */
import type { Request, Response, NextFunction } from 'express';
import { Errors, asyncHandler } from './errors.js';
import { getStore } from '../infra/store.js';
import { incr as metric } from '../infra/metrics.js';
import { logger } from '../infra/logger.js';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Derive the throttle key (defaults to client IP). */
  key?: (req: Request) => string;
}

function clientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0]!.trim();
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/** Sliding-window-counter check. Returns allow + remaining + reset. */
async function evaluate(
  name: string,
  key: string,
  windowMs: number,
  max: number,
): Promise<{ allowed: boolean; remaining: number; resetSec: number }> {
  const store = await getStore();
  const now = Date.now();
  const windowSec = Math.ceil(windowMs / 1000);
  const currentWindow = Math.floor(now / windowMs);
  const prevWindow = currentWindow - 1;
  const base = `rl:${name}:${key}`;

  const curr = await store.incr(`${base}:${currentWindow}`, windowSec * 2);
  const prevRaw = await store.get(`${base}:${prevWindow}`);
  const prev = prevRaw ? parseInt(prevRaw, 10) || 0 : 0;

  const elapsedFraction = (now % windowMs) / windowMs;
  const estimated = prev * (1 - elapsedFraction) + curr;
  const resetSec = Math.ceil((windowMs - (now % windowMs)) / 1000);

  return {
    allowed: estimated <= max,
    remaining: Math.max(0, Math.floor(max - estimated)),
    resetSec,
  };
}

export function createRateLimiter(name: string, options: RateLimitOptions) {
  const keyFn = options.key ?? clientIp;
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let result: { allowed: boolean; remaining: number; resetSec: number };
    try {
      result = await evaluate(name, keyFn(req), options.windowMs, options.max);
    } catch (err) {
      // Fail open — never let a store outage break the API.
      metric('store.errors');
      logger.warn('rate-limit store error (failing open)', {
        limiter: name,
        error: err instanceof Error ? err.message : String(err),
      });
      next();
      return;
    }

    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + result.resetSec));

    if (!result.allowed) {
      metric('ratelimit.hits');
      res.setHeader('Retry-After', String(result.resetSec));
      next(Errors.tooMany('Rate limit exceeded. Try again later.'));
      return;
    }
    next();
  });
}

// ── Key helpers (per-IP / per-user / per-device / per-API-key) ───────────────
export const byIp = clientIp;
export const byUser = (req: Request): string => {
  const uid = (req as Request & { auth?: { uid?: string } }).auth?.uid;
  return uid ? `u:${uid}` : clientIp(req);
};
export const byDevice = (req: Request): string => {
  const id = req.headers['x-device-id'];
  return typeof id === 'string' && id ? `d:${id}` : clientIp(req);
};
export const byApiKey = (req: Request): string => {
  const key = (req as Request & { apiKey?: { keyId?: string } }).apiKey?.keyId;
  return key ? `k:${key}` : clientIp(req);
};

// Tuned default limiters (per client, per window).
export const limiters = {
  auth: createRateLimiter('auth', { windowMs: 60_000, max: 20 }),
  cliLogin: createRateLimiter('cli-login', { windowMs: 60_000, max: 10 }),
  projectCreate: createRateLimiter('project-create', { windowMs: 60_000, max: 30, key: byUser }),
  keyCreate: createRateLimiter('key-create', { windowMs: 60_000, max: 10, key: byUser }),
  deviceRegister: createRateLimiter('device-register', { windowMs: 60_000, max: 30, key: byUser }),
  public: createRateLimiter('public', { windowMs: 60_000, max: 100 }),
};
