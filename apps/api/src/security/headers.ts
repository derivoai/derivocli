/**
 * Security headers applied to every response. Implemented manually to avoid an
 * extra dependency. Covers the headers required by Phase 11.
 */
import type { Request, Response, NextFunction } from 'express';

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // The API serves JSON only; a tight CSP is appropriate.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  // HSTS only meaningful over HTTPS; harmless to send and correct in production.
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  // Don't advertise the framework.
  res.removeHeader('X-Powered-By');
  next();
}
