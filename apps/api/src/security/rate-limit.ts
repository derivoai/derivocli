/**
 * In-memory rate limiting (fixed window). Suitable for a single-instance beta.
 * For multi-instance production, back this with Redis (noted in the report).
 */
import type { Request, Response, NextFunction } from 'express';
import { Errors } from './errors.js';

interface Bucket {
  count: number;
  resetAt: number;
}

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

export function createRateLimiter(name: string, options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  const keyFn = options.key ?? clientIp;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${name}:${keyFn(req)}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, options.max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > options.max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      next(Errors.tooMany('Rate limit exceeded. Try again later.'));
      return;
    }

    next();
  };
}

// Tuned default limiters (per client, per window).
export const limiters = {
  auth: createRateLimiter('auth', { windowMs: 60_000, max: 20 }),
  cliLogin: createRateLimiter('cli-login', { windowMs: 60_000, max: 10 }),
  projectCreate: createRateLimiter('project-create', { windowMs: 60_000, max: 30 }),
  keyCreate: createRateLimiter('key-create', { windowMs: 60_000, max: 10 }),
  deviceRegister: createRateLimiter('device-register', { windowMs: 60_000, max: 30 }),
  public: createRateLimiter('public', { windowMs: 60_000, max: 100 }),
};
